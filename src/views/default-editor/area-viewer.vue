<template>
  <div :id="layer?.uuid" class="layer-instance" ref="areaViewer" :style="style"></div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { Layer } from './common/types';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import controller from './common/canvas-state-controller';
  import { onDeleteAreaEvent } from './common/event';
  import { Area, Pin } from './draw-element';
  import { useCanvasState } from '@/store/modules/canvas-state';

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
  function render(element: Area | Pin) {
    if (areaViewer.value) {
      element.render(areaViewer.value);
      element.drawAreaComplete();
    } else {
      setTimeout(() => {
        render(element);
        element.drawAreaComplete();
      }, 50);
    }
  }
  watch(
    () => props.layer?.areas,
    () => {
      if (props.layer && props.layer.areas && props.layer.areas.length > 0) {
        for (let index = 0; index < props.layer.areas.length; index++) {
          const area = props.layer.areas[index];
          // 绘制更新
          if (!area.getDrawAreaComplete() || area.getDrawAreaUpdate()) {
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
          // 绘制更新
          if (!pin.getDrawAreaComplete() || pin.getDrawAreaUpdate()) {
            render(pin);
          }
        }
      }
    },
    { deep: true, immediate: true },
  );

  const canvasState = useCanvasState();
  onDeleteAreaEvent(() => {
    if (props.layer) {
      for (const index in controller.getCurrentAreas()) {
        const area = controller.getCurrentAreas()[index];
        const posIndex = props.layer.areas.findIndex((value) => value.isSame(area));
        if (posIndex > -1) {
          const areas = props.layer.areas.splice(posIndex, 1);
          areas[0].destroy();
          controller.getCurrentAreas().splice(Number(index), 1);
          canvasState.getAreaMap.delete(areas[0].getUuid());
        }
      }
    }
  });
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
      text-align: center;
      user-select: none;
      pointer-events: auto;
    }
    .lock-moveable {
      position: absolute;
      font-size: 18px;
      text-align: center;
      user-select: none;
      pointer-events: none;
    }
    .selecto-selection {
      pointer-events: auto;
    }
  }
  .moveable-control-box {
    z-index: 500 !important;
  }
  .draw-element-tooltip {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
  }
</style>
