<template>
  <div
    id="scroller"
    ref="scrollerRef"
    :class="['scroller', controller.isDrawingArea() ? 'active' : '']"
  >
    <template v-for="layer in layersRef" :key="layer.uuid">
      <area-viewer :layer="layer" v-show="layer.visible" />
    </template>
    <area-canvas
      ref="areaCanvasRef"
      v-if="controller.isDrawingArea()"
      :style="styleRef"
      :offset="offsetRef"
    />
    <mask-canvas :visible="controller.isDrawingShape()" :style="styleRef" :offset="offsetRef" />
  </div>
</template>

<script setup lang="ts">
  import type Area from './common/area';
  import type { Layer } from './common/types';
  import { Ref, inject, nextTick, ref, watch } from 'vue';
  import MaskCanvas from './mask-canvas.vue';
  import AreaCanvas from './area-canvas.vue';
  import AreaViewer from './area-viewer.vue';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { onFocusAreaEvent } from './common/event';
  import controller from './common/canvas-state-controller';
  import { useScroll } from '@vueuse/core';
  import { useCanvasState } from '@/store/modules/canvas-state';

  const layersRef: Ref<Layer[]> = inject('layers', [] as any);
  const configRef = useEditorConfig();

  // 滚动偏移
  const state = useCanvasState();
  const scrollerRef = ref<HTMLElement>();
  const { x, y } = useScroll(scrollerRef, { throttle: 50 });
  // TODO: 优化偏移
  const offsetRef = ref<Offset>({ x: 0, y: 0 });
  watch([() => x.value, () => y.value], () => {
    state.setOffset({ x: x.value, y: y.value });
  });
  const styleRef = ref('');
  watch([() => controller.isDrawingArea(), () => controller.isDrawingShape()], () => {
    if (controller.isDrawingArea() || controller.isDrawingShape()) {
      const top =
        y.value - 1500 > 0
          ? y.value + 5000 > configRef.size.y
            ? configRef.size.y - 5000
            : y.value
          : 0;
      const left =
        x.value - 1500 > 0
          ? x.value + 5000 > configRef.size.x
            ? configRef.size.x - 5000
            : x.value
          : 0;
      offsetRef.value.x = left;
      offsetRef.value.y = top;
      styleRef.value = `top: ${top}px; left: ${left}px;`;
    }
  });
  // 聚焦区域事件
  onFocusAreaEvent((_, area: Area) => {
    const scroller = scrollerRef.value;
    if (scroller) {
      // TODO: 优化聚焦
      scroller.scroll({
        left: area.getBoundRect()[0],
        top: area.getBoundRect()[1],
      });
      controller.setCurrentArea(null);
      nextTick(() => {
        controller.setCurrentArea(area);
      });
    }
  });

  // 区域编辑
  const areaCanvasRef = ref<Recordable>();
  function getCreatedArea() {
    if (areaCanvasRef.value) {
      return areaCanvasRef.value.getCreatedArea();
    }
    return null;
  }
  defineExpose({
    getCreatedArea,
  });
</script>

<style lang="less">
  .scroller {
    position: relative;
    height: calc(100% - 10px);
    width: calc(100% - 10px);
    border: 3px solid #5a5a5a;
    overflow: auto;
  }
  .scroller.active {
    border: 3px solid #c9cdd4;
  }
</style>
