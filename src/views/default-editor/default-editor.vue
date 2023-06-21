<template>
  <div
    class="map-editor"
    :style="{ height: isLocal() ? 'calc(100vh - 100px)' : 'calc(100vh - 70px)' }"
  >
    <default-options @end-edit-area="handleEndEditArea" />
    <div class="content-box">
      <div ref="hRuler" class="ruler h-ruler"></div>
      <div ref="vRuler" class="ruler v-ruler"></div>
      <canvas-container ref="areaCanvasRef" />
    </div>
    <status-bar></status-bar>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import StatusBar from './children/status-bar.vue';
  import CanvasContainer from './canvas-container.vue';
  import DefaultOptions from './default-options.vue';
  import { getRandomDomId } from '../../utils/uuid';
  import controller from './common/canvas-state-controller';
  import { Area } from './draw-element';
  import useRuler from '@/hooks/useRuler';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { isLocal } from '@/utils/env';

  const configRef = useEditorConfig();

  // 图层数据
  const canvasState = useCanvasState();
  if (!canvasState.getLayers.length) {
    canvasState.setLayers([
      {
        uuid: getRandomDomId(),
        name: '默认图层',
        hot: true,
        lock: false,
        visible: true,
        map: null,
        areas: [],
        pins: [],
      },
    ]);
  }

  // 标尺相关
  const vRuler = ref();
  const vRulerInstance = useRuler(vRuler, {
    type: 'vertical',
    width: 30,
    mainLineSize: 25,
    font: '11px sans-serif',
    unit: configRef.getMapSize.used ? configRef.getSize.scale : 50,
    textFormat: (scale) =>
      Math.round(
        configRef.getMapSize.used
          ? configRef.getMapSize.ltX + scale * configRef.getSize.scale
          : scale,
      ).toString(),
    range: [0, configRef.getSize.y],
  });

  const hRuler = ref();
  const hRulerInstance = useRuler(hRuler, {
    type: 'horizontal',
    height: 30,
    mainLineSize: 25,
    unit: configRef.getMapSize.used ? configRef.getSize.scale : 50,
    font: '11px sans-serif',
    textFormat: (scale) =>
      Math.round(
        configRef.getMapSize.used
          ? configRef.getMapSize.ltX + scale * configRef.getSize.scale
          : scale,
      ).toString(),
    range: [0, configRef.getSize.x],
  });
  // 滚动条滚动时修改标尺offset
  watch(
    () => canvasState.getOffset,
    () => {
      hRulerInstance.scroll(canvasState.getOffset.x);
      vRulerInstance.scroll(canvasState.getOffset.y);
    },
  );

  // 区域编辑
  const areaCanvasRef = ref<Recordable>();
  async function handleEndEditArea(name: string, type: string, complete: boolean) {
    if (complete && areaCanvasRef.value) {
      const area: Area = areaCanvasRef.value.getCreatedArea();
      if (!area) return;
      for (let index = canvasState.layers.length - 1; index >= 0; index--) {
        const element = canvasState.layers[index];
        if (element.hot) {
          area.setName(name);
          area.type = type;
          // @ts-ignore
          element.areas.push(area);
          canvasState.getAreaMap.set(area.getUuid(), area);
        }
      }
    } else {
      controller.getCurrentAreas()[0]?.show();
    }
    controller.endDrawingArea();
  }
</script>

<style lang="less">
  .map-editor {
    display: flex;
    height: calc(100vh - 70px);
    background-color: #1e1e1e;
    margin-bottom: 10px;
  }
  .content-box {
    position: relative;
    flex: 1;
    border-radius: 3px;
    padding-left: 30px;
    padding-top: 30px;
    background-color: rgb(43, 43, 43);
    transition: width 0.2s ease;
    max-width: 100%;
  }

  .ruler {
    position: absolute;
  }
  .h-ruler {
    top: 0px;
    height: 28px;
    width: calc(100% - 33px);
  }
  .v-ruler {
    left: 0px;
    height: calc(100% - 40px);
    width: 28px;
  }
</style>
