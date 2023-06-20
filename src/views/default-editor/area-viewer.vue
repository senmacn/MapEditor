<template>
  <div :id="layer?.uuid" class="layer-instance" ref="areaViewer" :style="style"></div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { Layer } from './common/types';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import controller from './common/canvas-state-controller';
  import { onDeleteAreaEvent, onEditAreaEvent } from './common/event';
  import { Area, Pin } from './draw-element';

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
      for (const index in controller.getCurrentAreas()) {
        const area = controller.getCurrentAreas()[index];
        const posIndex = props.layer.areas.findIndex((value) => value.isSame(area));
        if (posIndex > -1) {
          const areas = props.layer.areas.splice(posIndex, 1);
          areas[0].destroy();
          controller.getCurrentAreas().splice(Number(index), 1);
        }
      }
    }
  });

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
</script>

<style lang="less">
  .layer-instance {
    position: absolute;
    top: 0;
    left: 0;
    background-repeat: no-repeat;
    background-size: contain;
    pointer-events: none;
    .moveable {
      position: absolute;
      font-size: 18px;
      color: red;
      text-align: center;
      user-select: none;
      pointer-events: auto;
    }
    .selecto-selection {
      pointer-events: auto;
    }
  }
  .moveable-control-box {
    z-index: 500 !important;
  }
</style>
