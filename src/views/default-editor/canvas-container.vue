<template>
  <div
    id="scroller"
    ref="scrollerRef"
    :class="[controller.isDrawing() ? 'active' : '']"
    @contextmenu="handleClickMenu"
    @click="handleClick"
    @mousedown="handleClickOutArea"
  >
    <div class="viewport" :style="style">
      <area-bottom-viewer :style="style"></area-bottom-viewer>
      <template v-for="layer in state.getLayers" :key="layer.uuid">
        <area-viewer :layer="layer" v-show="layer.visible" :style="style" />
      </template>
      <area-canvas ref="areaCanvasRef" v-if="controller.isDrawing()" />
      <pen-canvas v-show="controller.isDrawingPen()" />
      <mask-canvas v-show="controller.isDrawingShape()" />
    </div>
  </div>
  <Contextmenu ref="contextmenuRef" @show-pin-modal="handleShowPinModal"></Contextmenu>
  <pin-modal ref="pinRef"></pin-modal>
</template>

<script setup lang="ts">
  import { provide, reactive, ref, watch } from 'vue';
  import MaskCanvas from './mask-canvas.vue';
  import AreaCanvas from './area-canvas.vue';
  import PenCanvas from './pen-canvas.vue';
  import AreaViewer from './area-viewer.vue';
  import AreaBottomViewer from './area-bottom-viewer.vue';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import controller from './common/canvas-state-controller';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import Contextmenu from './children/contextmenu.vue';
  import PinModal from './children/pin-modal.vue';
  import useSelecto from './utils/useSelecto';
  import useInfiniteViewer from './hooks/useInfiniteViewer';
  import { isString } from '@/utils/is';

  const state = useCanvasState();
  const configRef = useEditorConfig();

  const style = `width: ${configRef.getProjectSizeConfigPxWidth}px; height: ${configRef.getProjectSizeConfigPxHeight}px;`;

  // zoom配置修改时，更新Rect
  watch(
    () => configRef.zoom,
    () => {
      setTimeout(() => {
        requestAnimationFrame(() => {
          controller.getCurrentAreas().forEach((area) => area?.moveable?.updateRect());
          controller.getCurrentPathway()?.moveable?.updateRect();
          updateRect();
        });
      }, 100);
    },
  );

  // 区域编辑
  const areaCanvasRef = ref<Recordable>();
  function getCreatedArea() {
    if (areaCanvasRef.value) {
      return areaCanvasRef.value.getCreatedArea();
    }
    return null;
  }
  function getCreatedPathway() {
    if (areaCanvasRef.value) {
      return areaCanvasRef.value.getCreatedPathway();
    }
    return null;
  }
  defineExpose({
    getCreatedArea,
    getCreatedPathway,
  });

  // 右键菜单
  const clickPositionRef = reactive({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  provide('clickPositionRef', clickPositionRef);
  const contextmenuRef = ref();
  function handleClickMenu(e: MouseEvent) {
    if (controller.isDrawing()) {
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

  // 无限视窗
  const [offset] = useInfiniteViewer('#scroller', '.viewport');
  watch(
    () => [offset.value[0], offset.value[1]],
    () => {
      state.setOffset({ x: -offset.value[0], y: -offset.value[1] });
      setTimeout(() => {
        requestAnimationFrame(() => {
          controller.getCurrentAreas().forEach((area) => area?.moveable?.updateRect());
          controller.getCurrentPathway()?.moveable?.updateRect();
          updateRect();
        });
      }, 100);
    },
  );

  // 框选
  const scrollerRef = ref();
  const { updateRect } = useSelecto(scrollerRef);

  function handleClickOutArea(e: MouseEvent) {
    if (!e.isTrusted) return;
    // 区分点击/拖拽
    const target = e.target as HTMLElement;
    // 区分点击空白处和区域(排除svg点击干扰)
    if (e.button === 0 && isString(target.className) && target.className.includes('scroll')) {
      if (controller.getCurrentAreas().length) {
        controller.getCurrentAreas().forEach((area) => {
          area.cancelSelect();
        });
        controller.setCurrentAreas([]);
      }
      // 这里只处理点击区域外的逻辑
      controller.getCurrentPin()?.cancelSelect();
      controller.setCurrentPin(null);
      controller.getCurrentPathway()?.cancelSelect();
      controller.setCurrentPathway(null);
    }
  }
</script>

<style lang="less">
  .bottom-layer {
    width: 100%;
    height: 100%;
  }
  .scroll-area-bg1 {
    width: calc(100% + 1000px);
    height: calc(100% + 1000px);
    position: absolute;
    top: 0;
    left: 0;
    background-position: -2px -2px;
    background-image: linear-gradient(0deg, rgb(146, 146, 146), transparent 3%),
      linear-gradient(90deg, rgb(146, 146, 146), transparent 3%);
    background-size: 25px 25px;
  }
  .scroll-area-bg2 {
    width: calc(100% + 1000px);
    height: calc(100% + 1000px);
    position: absolute;
    top: 0;
    left: 0;
    background-position: -2px -2px;
    background-image: linear-gradient(0deg, rgb(146, 146, 146), transparent 2%),
      linear-gradient(90deg, rgb(146, 146, 146), transparent 2%);
    background-size: 50px 50px;
  }
  #scroller {
    position: relative;
    height: calc(100% - 10px);
    width: calc(100% - 10px);
    border: 2px solid #5a5a5a;
    overflow: hidden;
  }
  #scroller.active {
    border: 2px solid black;
  }
  .viewport {
    position: relative;
    transition: transform 0.1s;
    transform-origin: 0px 0px;
    will-change: transform;
  }
</style>
