<template>
  <div :id="layer?.uuid" class="canvas-array" :style="style">
    <template v-for="item in canvasArray" :key="item">
      <default-canvas :pos-key="item" :layer="layer" />
    </template>
  </div>
</template>

<script setup lang="ts">
  import type { Layer } from './common/types';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import defaultCanvas from './default-canvas.vue';
  import { watch } from 'vue';
  import controller from './common/canvas-state-controller';
  import { onDeleteAreaEvent } from './common/event';

  const props = defineProps({
    layer: {
      type: Object as PropType<Layer>,
    },
  });

  const configRef = useEditorConfig();
  const yBlocks =
    Math.floor(Number(configRef.size.x) / 5000) + (Number(configRef.size.x) % 5000 === 0 ? 0 : 1);
  const xBlocks =
    Math.floor(Number(configRef.size.y) / 5000) + (Number(configRef.size.y) % 5000 === 0 ? 0 : 1);
  const canvasArray: [number, number][] = [];
  for (let _y = 0; _y < yBlocks; _y++) {
    for (let _x = 0; _x < xBlocks; _x++) {
      canvasArray.push([_x, _y]);
    }
  }
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
  watch(
    () => props.layer?.areas,
    () => {
      if (props.layer && props.layer.areas && props.layer.areas.length > 0) {
        for (let index = 0; index < props.layer.areas.length; index++) {
          const area = props.layer.areas[index];
          if (!area.getDrawAreaComplete()) {
            props.layer.ctxs.forEach((ctx) => {
              ctx.mixin(area);
            });
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
          props.layer.areas.splice(index, 1);
          props.layer.ctxs.forEach((ctx) => ctx.clean());
          if (props.layer.areas.length > 0) {
            props.layer.ctxs.forEach((ctx) => {
              props.layer &&
                ctx.putImageData(
                  props.layer?.areas[0].getData(),
                  props.layer?.areas[0].getBoundRect()[0],
                  props.layer?.areas[0].getBoundRect()[1],
                );
            });
            props.layer.areas.forEach((area, index) => {
              if (index !== 0 && props.layer) {
                props.layer.ctxs.forEach((ctx) => {
                  ctx.mixin(area);
                });
              }
            });
          }
          setTimeout(() => {
            controller.setCurrentArea(null);
          });
        }
      }
    }
  });
</script>

<style lang="less" scoped>
  .canvas-array {
    position: relative;
    overflow: hidden;
  }
</style>
