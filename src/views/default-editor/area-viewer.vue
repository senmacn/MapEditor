<template>
  <div
    :id="layer?.uuid"
    class="layer-instance"
    ref="areaViewer"
    :style="style"
    @click="handleClickOutArea"
  ></div>
</template>

<script setup lang="ts">
  import { nextTick, ref, watch } from 'vue';
  import { Layer } from './common/types';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import controller from './common/canvas-state-controller';
  import { emitClickAreaEvent, onDeleteAreaEvent } from './common/event';
  import * as canvasUtil from './common/canvas-util';

  const props = defineProps({
    layer: {
      type: Object as PropType<Layer>,
    },
  });

  const configRef = useEditorConfig();
  const style = `width: ${configRef.size.x}px; height: ${configRef.size.y}px;`;

  // 背景图片
  watch(
    () => props.layer?.map,
    () => {
      if (props.layer) {
        const layer = document.getElementById(props.layer?.uuid);
        if (!layer) return;
        layer.style.setProperty('background-image', 'url(' + props.layer?.map + ')');
      }
    },
  );

  // 添加区域时渲染
  const areaViewer = ref();
  watch(
    () => props.layer?.areas,
    () => {
      if (props.layer && props.layer.areas && props.layer.areas.length > 0) {
        for (let index = 0; index < props.layer.areas.length; index++) {
          const area = props.layer.areas[index];
          // 绘制
          if (!area.getDrawAreaComplete() && areaViewer.value) {
            area.render(areaViewer.value);
            area.drawAreaComplete();
          }
        }
      }
    },
    { deep: true },
  );

  onDeleteAreaEvent(() => {
    if (props.layer && props.layer.hot) {
      const area = controller.getCurrentArea();
      if (area != null) {
        const index = props.layer.areas.findIndex((value) => value.isSame(area));
        if (index > -1) {
          const areas = props.layer.areas.splice(index, 1);
          areas[0].destroy();
        }
      }
    }
  });

  function handleClickOutArea(e: MouseEvent) {
    const target = e.target as HTMLElement;
    // 区分点击空白处和区域
    if (target.className.includes('layer-instance')) {
      // 关闭显示
      Array.from(document.getElementsByClassName('moveable-control-box')).forEach(
        (item: HTMLElement) => (item.style.visibility = 'hidden'),
      );
      // 这里只处理点击区域外的逻辑
      controller.setCurrentArea(null);
    } else {
      const id = target.id;
      Array.from(document.getElementsByClassName('moveable-control-box')).forEach(
        (item: HTMLElement) => {
          if (!item.className.includes(id)) {
            item.style.visibility = 'hidden';
          }
        },
      );
    }
  }

  watch(
    () => controller.isEditingArea(),
    () => {
      let defaultCanvas = document.getElementById(props.layer?.uuid || '') as HTMLElement;
      if (defaultCanvas == null) return;
      if (controller.isEditingArea()) {
        defaultCanvas.style.visibility = 'hidden';
      } else {
        defaultCanvas.style.visibility = 'visible';
      }
    },
  );

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
</script>

<style lang="less">
  .layer-instance {
    position: absolute;
    top: 0;
    left: 0;
    .moveable {
      position: absolute;
    }
  }
</style>
