<template>
  <div
    :id="layer?.uuid"
    class="layer-instance"
    ref="areaViewer"
    :style="style"
    @mousedown="handleClickOutAreaBefore"
    @mouseup="handleClickOutArea"
  ></div>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { Layer } from './common/types';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import controller from './common/canvas-state-controller';
  import { onDeleteAreaEvent, onEditAreaEvent } from './common/event';
  import { Area, Pin } from './draw-element';
  import { isString } from '@/utils/is';
  import useSelecto from './utils/useSelecto';
  import { message } from 'ant-design-vue';
  import { copyImageData } from './utils/image-data-util';

  const props = defineProps({
    layer: {
      type: Object as PropType<Layer>,
    },
  });

  const configRef = useEditorConfig();
  const style = `width: ${configRef.size.x}px; height: ${configRef.size.y}px;`;

  // 背景图片
  watch(
    [() => props.layer?.map, () => props.layer?.transparency],
    () => {
      if (props.layer && props.layer?.map) {
        const layer = document.getElementById(props.layer?.uuid);
        if (!layer) {
          const map = props.layer.map;
          props.layer.map = null;
          setTimeout(() => {
            if (props.layer) props.layer.map = map;
          }, 50);
        } else {
          layer.style.setProperty('background-image', `url(${props.layer?.map})`);
          layer.style.setProperty('opacity', `${props.layer?.transparency}`);
        }
      }
    },
    { immediate: true },
  );

  // 添加区域时渲染
  const areaViewer = ref();
  useSelecto(areaViewer);
  function render(target: Area | Pin) {
    if (areaViewer.value) {
      target.render(areaViewer.value);
      target.drawAreaComplete();
    } else {
      setTimeout(() => render(target), 50);
    }
  }
  watch(
    () => props.layer?.areas,
    () => {
      if (props.layer && props.layer.areas && props.layer.areas.length > 0) {
        for (let index = 0; index < props.layer.areas.length; index++) {
          const area = props.layer.areas[index];
          // 绘制
          if (!area.getDrawAreaComplete()) {
            render(area);
          }
        }
      }
    },
    { deep: true, immediate: true },
  );
  watch(
    () => props.layer?.pins,
    () => {
      if (props.layer && props.layer.pins && props.layer.pins.length > 0) {
        for (let index = 0; index < props.layer.pins.length; index++) {
          const pin = props.layer.pins[index];
          // 绘制
          if (!pin.getDrawAreaComplete()) {
            render(pin);
          }
        }
      }
    },
    { deep: true, immediate: true },
  );

  onDeleteAreaEvent(() => {
    if (props.layer) {
      for (const area of controller.getCurrentAreas()) {
        const index = props.layer.areas.findIndex((value) => value.isSame(area));
        if (index > -1) {
          const areas = props.layer.areas.splice(index, 1);
          areas[0].destroy();
        }
      }
      controller.setCurrentAreas([]);
    }
  });

  const mouseDown = [0, 0];
  function handleClickOutAreaBefore(e: MouseEvent) {
    if (!e.isTrusted) return;
    mouseDown[0] = e.x;
    mouseDown[1] = e.y;
  }
  function handleClickOutArea(e: MouseEvent) {
    if (!e.isTrusted) return;
    // 区分点击/拖拽
    if (Math.abs(mouseDown[0] - e.x) + Math.abs(mouseDown[1] - e.y) > 5) return;
    const target = e.target as HTMLElement;
    // 区分点击空白处和区域(排除svg点击干扰)
    if (isString(target.className) && target.className.includes('layer-instance')) {
      // 关闭显示
      Array.from(document.getElementsByClassName('moveable-control-box')).forEach(
        (item: HTMLElement) => (item.style.visibility = 'hidden'),
      );
      controller.getCurrentAreas()[0]?.cancelSelect();
      controller.getCurrentPin()?.cancelSelect();
      // 这里只处理点击区域外的逻辑
      controller.setCurrentAreas([]);
      controller.setCurrentPin(null);
    } else {
      const id = target.id;
      // 点击到非选中区域
      const areas = controller.getCurrentAreas();
      if (areas.length && !areas.some((area) => area.getUuid() === id)) {
        controller.getCurrentAreas().forEach((area) => area.cancelSelect());
        controller.getCurrentPin()?.cancelSelect();
        controller.setCurrentAreas([]);
        controller.setCurrentPin(null);
      }
    }
  }

  onEditAreaEvent(function () {
    const currentArea = controller.getCurrentAreas()[0];
    if (currentArea) {
      currentArea.cancelSelect();
      currentArea.hide();
    }
  });

  // zoom配置修改时，修改大小
  // watch(
  //   () => configRef.zoom,
  //   () => {
  //     if (configRef) {
  //       const layer = document.getElementById(canvasId);
  //       if (!layer) return;
  //       const style = canvasUtil.getZoomChangeStyle(configRef.zoom);
  //       layer.style.setProperty('transform', style.transform);
  //       layer.style.setProperty('top', style.top);
  //       layer.style.setProperty('left', style.left);
  //     }
  //   },
  // );

  let copyAreas: Area[] = [];
  function handleCopyPasteArea(e: KeyboardEvent) {
    if (e.ctrlKey && e.isTrusted) {
      if (e.key === 'c') {
        if (controller.getCurrentAreas().length > 0) {
          copyAreas = controller.getCurrentAreas().slice() as Area[];
          message.info('复制成功！');
        }
      }
      if (e.key === 'v') {
        if (copyAreas.length) {
          copyAreas.forEach((area) => {
            // 偏移防止重叠
            const newBoundRect = Object.assign({}, area.getBoundRect()) as Box;
            newBoundRect[0] = newBoundRect[0] + Math.floor(newBoundRect[2] / 10);
            newBoundRect[1] = newBoundRect[1] + Math.floor(newBoundRect[3] / 10);
            const newArea = new Area(
              area.getName() + '_拷贝',
              copyImageData(area.getData()),
              newBoundRect,
            );
            props.layer?.areas.push(newArea);
            render(newArea);
            // 清空选中
            controller.setCurrentAreas([]);
          });
          message.info('粘贴成功！');
        }
      }
    }
  }
  // 挂载时初始化
  onMounted(() => {
    document.body.addEventListener('keydown', handleCopyPasteArea);
  });
  onBeforeUnmount(() => {
    document.body.removeEventListener('keydown', handleCopyPasteArea);
  });
</script>

<style lang="less">
  .layer-instance {
    position: absolute;
    top: 0;
    left: 0;
    background-repeat: no-repeat;
    background-size: contain;
    .moveable {
      position: absolute;
      font-size: 18px;
      color: red;
      text-align: center;
      user-select: none;
    }
  }
  .moveable-control-box {
    z-index: 500 !important;
  }
</style>
