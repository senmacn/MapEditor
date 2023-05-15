<template>
  <div
    id="scroller"
    ref="scrollerRef"
    :class="['scroller', controller.isDrawingArea() ? 'active' : '']"
    @contextmenu="handleClickMenu"
    @click="handleClick"
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
  <Contextmenu ref="contextmenuRef" @show-pin-modal="handleShowPinModal"></Contextmenu>
  <Pin-modal ref="pinRef"></Pin-modal>
</template>

<script setup lang="ts">
  import Area from './draw-element/area';
  import DrawElement from './draw-element';
  import type { Layer } from './common/types';
  import { Ref, inject, nextTick, provide, reactive, ref, watch } from 'vue';
  import MaskCanvas from './mask-canvas.vue';
  import AreaCanvas from './area-canvas.vue';
  import AreaViewer from './area-viewer.vue';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { onFocusAreaEvent } from './common/event';
  import controller from './common/canvas-state-controller';
  import { useScroll } from '@vueuse/core';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import Contextmenu from './children/contextmenu.vue';
  import PinModal from './children/pin-modal.vue';

  const layersRef: Ref<Layer[]> = inject('layers', [] as any);
  const configRef = useEditorConfig();

  // 滚动偏移
  const state = useCanvasState();
  const scrollerRef = ref<HTMLElement>();
  const { x, y } = useScroll(scrollerRef, { throttle: 50 });
  const offsetRef = ref<Offset>({ x: 0, y: 0 });
  watch([() => x.value, () => y.value], () => {
    state.setOffset({ x: x.value, y: y.value });
  });
  const styleRef = ref('');
  watch([() => controller.isDrawingArea(), () => controller.isDrawingShape()], () => {
    if (controller.isDrawingArea() || controller.isDrawingShape()) {
      const top =
        y.value - 2000 > 0
          ? y.value + 5000 > configRef.size.y
            ? configRef.size.y - 5000
            : y.value - 2000
          : 0;
      const left =
        x.value - 2000 > 0
          ? x.value + 5000 > configRef.size.x
            ? configRef.size.x - 5000
            : x.value - 2000
          : 0;
      offsetRef.value.x = left;
      offsetRef.value.y = top;
      styleRef.value = `top: ${top}px; left: ${left}px;`;
    }
  });
  // 快速定位事件
  onFocusAreaEvent((_, ele: DrawElement) => {
    const scroller = scrollerRef.value;
    if (scroller) {
      const boundRect = ele.getBoundRect();
      let left = boundRect[0] - scroller.clientWidth / 2 + boundRect[2] / 2;
      left = left > 0 ? Math.floor(left) : 0;
      let top = boundRect[1] - scroller.clientHeight / 2 + boundRect[3] / 2;
      top = top > 0 ? Math.floor(top) : 0;
      scroller.scroll({ left, top });
      controller.setCurrentArea(null);
      controller.setCurrentPin(null);
      nextTick(() => {
        ele instanceof Area ? controller.setCurrentArea(ele) : controller.setCurrentPin(ele);
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

  // 右键菜单
  const clickPositionRef = reactive({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  provide('clickPositionRef', clickPositionRef);
  const contextmenuRef = ref();
  function handleClickMenu(e: MouseEvent) {
    e.preventDefault();
    console.log(e);
    
    clickPositionRef.x = e.x;
    clickPositionRef.y = e.y;
    clickPositionRef.offsetX = e.offsetX;
    clickPositionRef.offsetY = e.offsetY;
    contextmenuRef.value?.show();
  }
  function handleClick() {
    contextmenuRef.value?.hide();
  }
  // 地图钉
  const pinRef = ref();
  function handleShowPinModal(create?: boolean) {
    create ? pinRef.value.setPin(null) : pinRef.value.setPin(controller.getCurrentPin());
  }
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
