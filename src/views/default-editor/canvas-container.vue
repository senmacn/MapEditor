<template>
  <div
    id="scroller"
    ref="scrollerRef"
    :class="['scroller', controller.isDrawingArea() ? 'active' : '']"
    @contextmenu="handleClickMenu"
    @click="handleClick"
  >
    <area-bottom-viewer class="bottom-layer"></area-bottom-viewer>
    <template v-for="layer in state.getLayers" :key="layer.uuid">
      <area-viewer :layer="layer" v-show="layer.visible" />
    </template>
    <area-canvas
      ref="areaCanvasRef"
      v-if="controller.isDrawingArea()"
      :style="styleRef"
      :offset="offsetRef"
    />
    <pen-canvas v-show="controller.isDrawingPen()" :style="styleRef" :offset="offsetRef" />
    <mask-canvas v-show="controller.isDrawingShape()" :style="styleRef" :offset="offsetRef" />
  </div>
  <Contextmenu
    ref="contextmenuRef"
    @show-pin-modal="handleShowPinModal"
    @delete-pin="handleDeletePin"
  ></Contextmenu>
  <pin-modal ref="pinRef"></pin-modal>
</template>

<script setup lang="ts">
  import DrawElement from './draw-element';
  import { nextTick, provide, reactive, ref, watch } from 'vue';
  import MaskCanvas from './mask-canvas.vue';
  import AreaCanvas from './area-canvas.vue';
  import PenCanvas from './pen-canvas.vue';
  import AreaViewer from './area-viewer.vue';
  import AreaBottomViewer from './area-bottom-viewer.vue';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { onFocusAreaEvent } from './common/event';
  import controller from './common/canvas-state-controller';
  import { useScroll } from '@vueuse/core';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import Contextmenu from './children/contextmenu.vue';
  import PinModal from './children/pin-modal.vue';
  import useSelecto from './utils/useSelecto';
  import { Modal } from 'ant-design-vue';

  const state = useCanvasState();
  const configRef = useEditorConfig();

  // 滚动偏移，以及框选
  const scrollerRef = ref();
  useSelecto(scrollerRef);
  const { x, y } = useScroll(scrollerRef, { throttle: 50 });
  const offsetRef = ref<Offset>({ x: 0, y: 0 });
  watch([() => x.value, () => y.value], () => {
    state.setOffset({ x: x.value, y: y.value });
  });
  const styleRef = ref('');
  watch([() => controller.isDrawingArea(), () => controller.isDrawingShape()], () => {
    if (controller.isDrawingArea() || controller.isDrawingShape()) {
      let top =
        y.value - 2000 > 0
          ? y.value + 5000 > configRef.size.y
            ? configRef.size.y - 5000
            : y.value - 2000
          : 0;
      let left =
        x.value - 2000 > 0
          ? x.value + 5000 > configRef.size.x
            ? configRef.size.x - 5000
            : x.value - 2000
          : 0;
      top = top < 0 ? 0 : top;
      left = left < 0 ? 0 : left;
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
      controller.setCurrentAreas([]);
      controller.setCurrentPin(null);
      nextTick(() => {
        ele.select();
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
    if (controller.isDrawingArea()) {
      return;
    }
    e.preventDefault();

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
  function handleDeletePin() {
    if (!controller.getCurrentPin()) {
      return;
    }
    const pinToDelete = controller.getCurrentPin();
    Modal.confirm({
      title: '提醒',
      content: '确定要删除选中的点吗？',
      okText: '确定',
      cancelText: '取消',
      onOk() {
        const posIndex = pinToDelete?.layer?.pins.findIndex((value) => value.isSame(pinToDelete)) as number;
        if (posIndex > -1) {
          pinToDelete?.layer?.pins.splice(posIndex, 1);
        }
        controller.setCurrentPin(null);
        setTimeout(() => {
          pinToDelete?.destroy();
        });
      },
    });
  }
</script>

<style lang="less">
  .bottom-layer {
    width: 100%;
    height: 100%;
  }
  .scroller {
    position: relative;
    height: calc(100% - 10px);
    width: calc(100% - 10px);
    border: 2px solid #5a5a5a;
    overflow: auto;
  }
  .scroller.active {
    border: 2px solid black;
  }
</style>
