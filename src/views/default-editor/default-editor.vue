<template>
  <div class="map-editor">
    <div :class="hideOptionRef ? 'content-box full-screen' : 'content-box'">
      <div ref="hRuler" class="ruler h-ruler"></div>
      <div ref="vRuler" class="ruler v-ruler"></div>
      <canvas-container ref="areaCanvasRef" />
    </div>
    <div :class="hideOptionRef ? 'option-box hide' : 'option-box'">
      <icon-right-circle
        class="option-control option-control-right"
        size="28"
        v-if="!hideOptionRef"
        @click="handleChangeHideState(true)"
      />
      <icon-left-circle
        class="option-control option-control-left"
        size="28"
        v-else
        @click="handleChangeHideState(false)"
      />
      <default-options @load-saves="handleLoadSaves" @end-edit-area="handleEndEditArea" />
      <thin-options v-if="hideOptionRef" @end-edit-area="handleEndEditArea" />
    </div>
    <status-bar></status-bar>
  </div>
</template>

<script setup lang="ts">
  import { Ref, provide, ref, watch } from 'vue';
  import StatusBar from './components/status-bar.vue';
  import CanvasContainer from './canvas-container.vue';
  import DefaultOptions from './default-options.vue';
  import ThinOptions from './thin-options.vue';
  import { getRandomDomId } from '../../utils/uuid';
  import controller from './common/canvas-state-controller';
  import { useToggle } from '@vueuse/core';
  import { Layer } from './common/types';
  import Area from './common/area';
  import useRuler from '@/hooks/useRuler';
  import { useCanvasState } from '@/store/modules/canvas-state';

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

  // 标尺相关
  const vRuler = ref();
  const vRulerInstance = useRuler(vRuler, {
    type: 'horizontal',
    height: 30,
    mainLineSize: 25,
    font: '11px sans-serif',
  });
  const hRuler = ref();
  const hRulerInstance = useRuler(hRuler, {
    type: 'vertical',
    width: 30,
    mainLineSize: 25,
    font: '11px sans-serif',
  });
  // 滚动条滚动时修改标尺offset
  const state = useCanvasState();
  watch(
    () => state.getOffset,
    () => {
      vRulerInstance.scroll(state.getOffset.x);
      hRulerInstance.scroll(state.getOffset.y);
    },
  );
  // 工具展示 + 标尺根据宽度调整
  const [hideOptionRef, changeHideState] = useToggle(false);
  function handleChangeHideState(value: boolean) {
    changeHideState(value);
    // 延迟一下更新标尺
    setTimeout(() => {
      vRulerInstance.resize();
      hRulerInstance.resize();
    }, 210);
  }

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

  function handleLoadSaves(layers) {
    layersRef.value.forEach((layer) => {
      layer.areas.forEach((area) => {
        area.destroy();
      });
    });
    layersRef.value = layers;
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
    position: relative;
    flex: 1;
    border-radius: 3px;
    margin-right: 10px;
    padding-left: 30px;
    padding-top: 30px;
    background-color: rgb(51, 51, 51);
    transition: width 0.2s ease;
    &.full-screen {
      max-width: 95vw;
    }
  }
  .option-box {
    position: relative;
    width: 405px;
    height: 100%;
    margin-bottom: 5px;
    padding: 10px;
    border-radius: 3px;
    background-color: rgb(51, 51, 51);
    transition: width 0.2s ease;
    &.hide {
      width: 0;
      position: absolute;
      right: -100px;
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
      right: 150px;
    }
  }

  .ruler {
    position: absolute;
  }
  .h-ruler {
    left: 0px;
    height: calc(100% - 40px);
    width: 28px;
  }
  .v-ruler {
    top: 0px;
    height: 28px;
    width: calc(100% - 33px);
  }
</style>
