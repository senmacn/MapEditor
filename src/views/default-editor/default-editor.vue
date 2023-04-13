<template>
  <div class="map-editor">
    <div :class="hideOptionRef ? 'content-box full-screen' : 'content-box'">
      <div
        ref="scrollerRef"
        :class="['scroller', controller.isDrawingArea() ? 'active' : '']"
        @contextmenu="handleWrapperContextmenu"
      >
        <template v-for="layer in layersRef" :key="layer.uuid">
          <canvas-array :layer="layer" v-show="layer.visible" />
        </template>
        <area-canvas
          ref="areaCanvasRef"
          v-if="controller.isDrawingArea()"
          :style="styleRef"
          :offset="offsetRef"
        />
        <mask-canvas
          :visible="controller.isDrawingShape() || controller.isCheckingArea()"
          :style="styleRef"
          :offset="offsetRef"
        />
      </div>
    </div>
    <div :class="hideOptionRef ? 'option-box hide' : 'option-box'">
      <icon-right-circle
        class="option-control option-control-right"
        size="28"
        v-if="!hideOptionRef"
        @click="() => changeHideState(true)"
      />
      <icon-left-circle
        class="option-control option-control-left"
        size="28"
        v-else
        @click="() => changeHideState(false)"
      />
      <default-options @end-edit-area="handleEndEditArea" />
    </div>
    <status-bar></status-bar>
  </div>
</template>

<script setup lang="ts">
  import { Ref, provide, ref, watch } from 'vue';
  import canvasArray from './canvas-array.vue';
  import maskCanvas from './mask-canvas.vue';
  import areaCanvas from './area-canvas.vue';
  import statusBar from './components/status-bar.vue';
  import defaultOptions from './default-options.vue';
  import { getRandomDomId } from '../../utils/uuid';
  import controller from './common/canvas-state-controller';
  import { useScroll, useToggle } from '@vueuse/core';
  import { Layer } from './common/types';
  import Area from './common/area';
  import { useEditorConfig } from '@/store/modules/editor-config';

  const [hideOptionRef, changeHideState] = useToggle(false);

  // 图层数据
  const layersRef = ref<Layer[]>([
    {
      uuid: getRandomDomId(),
      name: '默认图层',
      level: 1,
      hot: true,
      visible: true,
      map: null,
      areas: [],
      ctxs: [],
    },
  ]) as Ref<Layer[]>;
  provide('layers', layersRef);

  // 区域编辑
  const areaCanvasRef = ref<Recordable>();
  function handleEndEditArea(name: string, complete: boolean) {
    if (complete && areaCanvasRef.value) {
      const area: Area = areaCanvasRef.value.getCreatedArea();
      if (!area) return;
      for (let index = layersRef.value.length - 1; index >= 0; index--) {
        const element = layersRef.value[index];
        if (element.hot) {
          area.setName(name);
          element.areas.push(area);
        }
      }
    }
    controller.endDrawingArea();
  }

  const configRef = useEditorConfig();
  // 滚动位置
  const scrollerRef = ref();
  const { x, y } = useScroll(scrollerRef);
  // 位置相关
  const offsetRef = ref<Offset>({ x: 0, y: 0 });
  const styleRef = ref('');
  watch(
    [
      () => controller.isDrawingArea(),
      () => controller.isDrawingShape(),
      () => controller.isCheckingArea(),
    ],
    () => {
      if (
        controller.isDrawingArea() ||
        controller.isDrawingShape() ||
        controller.isCheckingArea()
      ) {
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
    },
  );

  // TODO: 右键菜单事件
  function handleWrapperContextmenu(e: MouseEvent) {
    if (e.target && (e.target as any).nodeName == 'CANVAS') {
    }
  }
</script>

<style lang="less">
  .map-editor {
    display: flex;
    height: 100%;
    background-color: #1e1e1e;
    margin-bottom: 10px;
  }
  .content-box {
    flex: 1;
    border-radius: 3px;
    margin: 10px;
    max-width: calc(100vw - 484px);
    padding: 10px;
    background-color: rgb(51, 51, 51);
    &.full-screen {
      max-width: 96vw;
    }
  }

  .scroller {
    position: relative;
    height: 100%;
    width: 100%;
    border: 3px solid #5a5a5a;
    overflow: auto;
  }
  .scroller.active {
    border: 3px solid #c9cdd4;
  }
  .option-box {
    position: relative;
    width: 405px;
    margin: 10px 10px 10px 5px;
    padding: 10px;
    border-radius: 3px;
    background-color: rgb(51, 51, 51);
    &.hide {
      width: 0;
      position: absolute;
      right: -500px;
    }
  }
  .option-control {
    position: absolute;
    top: 40%;
    background-color: transparent;
    cursor: pointer;
  }
  .option-control-right {
    right: 411px;
  }
  .option-control-left {
    right: 500px;
  }
</style>
