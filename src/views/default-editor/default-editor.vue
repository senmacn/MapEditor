<template>
  <div
    class="map-editor"
    :style="{ height: isLocal() ? 'calc(100vh - 100px)' : 'calc(100vh - 70px)' }"
  >
    <default-options @end-edit-area="handleEndDrawingArea" />
    <div class="content-box">
      <div ref="hRuler" class="ruler h-ruler"></div>
      <div ref="vRuler" class="ruler v-ruler"></div>
      <canvas-container ref="areaCanvasRef" />
    </div>
    <status-bar></status-bar>
  </div>
  <choose-area-point-modal
    ref="confirmModelRef"
    @confirm-end="handleConfirmEnd"
  ></choose-area-point-modal>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import StatusBar from './children/status-bar.vue';
  import CanvasContainer from './canvas-container.vue';
  import ChooseAreaPointModal from './children/choose-area-point-modal.vue';
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
    controller.setCurrentLayer(canvasState.getLayers[canvasState.getLayers.length - 1]);
  }

  // 标尺相关
  const vRuler = ref();
  const unit = configRef.getMapSize.used
    ? configRef.getSize.scale > 50
      ? configRef.getSize.scale
      : 50
    : 50;
  const vRulerInstance = useRuler(vRuler, {
    type: 'vertical',
    width: 30,
    unit: unit,
    textFormat: (scale) =>
      Math.round(
        configRef.getMapSize.used
          ? configRef.getMapSize.ltY + scale * configRef.getSize.scale
          : scale,
      ).toString(),
    range: [0, configRef.getSize.y],
  });

  const hRuler = ref();
  const hRulerInstance = useRuler(hRuler, {
    type: 'horizontal',
    height: 30,
    unit: unit,
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
  // zoom配置修改时，修改滚动条
  watch(
    () => configRef.zoom,
    () => {
      if (configRef) {
        const unit = configRef.getMapSize.used
          ? configRef.getSize.scale > 50
            ? configRef.getSize.scale
            : 50
          : 50;
        vRulerInstance.rebuild({
          type: 'vertical',
          width: 30,
          unit: unit,
          textFormat: (scale) =>
            Math.round(
              (configRef.getMapSize.used
                ? configRef.getMapSize.ltY + scale * configRef.getSize.scale
                : scale) / configRef.zoom,
            ).toString(),
          range: [0, configRef.getSize.y * configRef.zoom],
        });
        hRulerInstance.rebuild({
          type: 'horizontal',
          height: 30,
          unit: unit,
          textFormat: (scale) =>
            Math.round(
              (configRef.getMapSize.used
                ? configRef.getMapSize.ltX + scale * configRef.getSize.scale
                : scale) / configRef.zoom,
            ).toString(),
          range: [0, configRef.getSize.x * configRef.zoom],
        });
      }
    },
  );

  // 区域编辑
  const areaCanvasRef = ref();
  const confirmModelRef = ref();
  const awaitConfirmBound = ref();
  async function handleEndDrawingArea(name: string, type: string, complete: boolean) {
    if (complete && areaCanvasRef.value) {
      const area: Area = areaCanvasRef.value.getCreatedArea();
      if (!area) return;
      const confirm = new Promise<Recordable>((resolve) => {
        awaitConfirmBound.value = resolve;
        confirmModelRef.value?.setUpConfirmArea({
          data: area.getData(),
          boundRect: area.getBoundRect(),
        });
      });
      // 等待确定
      const confirmData = await confirm;
      if (!confirmData) return;
      // 使用选取区域内的点后的新data
      area.setChoosePoint(confirmData.point);
      area.setData(confirmData.data);
      // 重新计算边界，编辑过程可能修改
      const oldRect = area.getBoundRect();
      confirmData.rect[0] = confirmData.rect[0] + oldRect[0];
      confirmData.rect[1] = confirmData.rect[1] + oldRect[1];
      area.setBoundRect(confirmData.rect);
      for (let index = canvasState.getLayers.length - 1; index >= 0; index--) {
        const element = canvasState.getLayers[index];
        if (element.hot) {
          area.setName(name);
          area.type = type;
          // @ts-ignore
          element.areas.push(area);
          area.layer = element;
          canvasState.getAreaMap.set(area.getUuid(), area);
        }
      }
    }
    controller.getCurrentAreas().forEach((area) => area.show());
    controller.endDrawingArea();
  }
  function handleConfirmEnd(point: [number, number], data: ImageData, rect: any, cancel: boolean) {
    if (cancel) {
      awaitConfirmBound.value && awaitConfirmBound.value(null);
    } else {
      awaitConfirmBound.value &&
        awaitConfirmBound.value({
          point,
          data,
          rect,
        });
    }
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
