<template>
  <div class="map-editor">
    <div :class="hideOptionRef ? 'content-box full-screen' : 'content-box'">
      <div class="scroller" @contextmenu="handleWrapperContextmenu">
        <template v-for="layer in layersRef" :key="layer.uuid">
          <default-canvas :layer="layer" v-show="layer.visible" />
        </template>
        <area-canvas ref="areaCanvasRef" v-if="controller.isDrawingArea()" />
        <mask-canvas v-show="controller.isDrawingShape() || controller.isCheckingArea()" />
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
  import { Ref, provide, ref } from 'vue';
  import defaultCanvas from './default-canvas.vue';
  import maskCanvas from './mask-canvas.vue';
  import areaCanvas from './area-canvas.vue';
  import statusBar from './components/status-bar.vue';
  import defaultOptions from './default-options.vue';
  import { getRandomDomId } from '../../utils/uuid';
  import controller from './common/canvas-state-controller';
  import { useToggle } from '@vueuse/core';
  import { Layer } from './common/types';
  import Area from './common/area';

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
    background-color: rgb(248, 248, 248);
    margin-bottom: 10px;
  }
  .content-box {
    flex: 1;
    border: 1px dashed #cccccc;
    margin: 10px;
    max-width: calc(100vw - 484px);
    padding: 10px;
    background-color: var(--color-bg-1);
    &.full-screen {
      max-width: 96vw;
    }
  }

  .scroller {
    position: relative;
    height: 100%;
    width: 100%;
    border: 3px solid rgb(143, 143, 143);
    overflow: auto;
  }
  .option-box {
    position: relative;
    width: 400px;
    margin: 10px;
    padding: 10px;
    border: 1px dashed #cccccc;
    background-color: var(--color-bg-1);
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
    right: 406px;
  }
  .option-control-left {
    right: 495px;
  }
</style>
