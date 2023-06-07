<template>
  <div class="ant-vue-body">
    <navbar></navbar>
    <div
      class="map-editor"
      :style="{ height: isLocal() ? 'calc(100vh - 100px)' : 'calc(100vh - 70px)' }"
    >
      <div :class="hideOptionRef ? 'content-box full-screen' : 'content-box'">
        <div ref="hRuler" class="ruler h-ruler"></div>
        <div ref="vRuler" class="ruler v-ruler"></div>
        <canvas-container ref="areaCanvasRef" />
      </div>
      <div :class="hideOptionRef ? 'option-box hide' : 'option-box'">
        <right-circle-outlined
          class="option-control option-control-right"
          size="28"
          v-if="!hideOptionRef"
          @click="handleChangeHideState(true)"
        />
        <left-circle-outlined
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
  </div>
  <confirm-bound-modal
    ref="confirmBoundModelRef"
    @confirm-end="handleConfirmBound"
  ></confirm-bound-modal>
</template>

<script setup lang="ts">
  import { Ref, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue';
  import StatusBar from './children/status-bar.vue';
  import CanvasContainer from './canvas-container.vue';
  import DefaultOptions from './default-options.vue';
  import ThinOptions from './thin-options.vue';
  import ConfirmBoundModal from './children/confirm-bound-modal.vue';
  import { getRandomDomId } from '../../utils/uuid';
  import controller from './common/canvas-state-controller';
  import { useToggle } from '@vueuse/core';
  import { Layer } from './common/types';
  import { Area } from './draw-element';
  import useRuler from '@/hooks/useRuler';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import Navbar from '@/components/navbar/index.vue';
  import { isLocal } from '@/utils/env';
  import modal from 'ant-design-vue/lib/modal';
  import { LeftCircleOutlined, RightCircleOutlined } from '@ant-design/icons-vue';

  const configRef = useEditorConfig();

  // 图层数据
  const layersRef = ref<Layer[]>([
    {
      uuid: getRandomDomId(),
      name: '默认图层',
      hot: true,
      visible: true,
      map: null,
      areas: [],
      pins: [],
    },
  ]) as Ref<Layer[]>;
  provide('layers', layersRef);

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
  const state = useCanvasState();
  watch(
    () => state.getOffset,
    () => {
      hRulerInstance.scroll(state.getOffset.x);
      vRulerInstance.scroll(state.getOffset.y);
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
  const awaitConfirmBound = ref();
  const confirmBoundModelRef = ref();
  async function handleEndEditArea(name: string, complete: boolean) {
    if (complete && areaCanvasRef.value) {
      const area: Area = areaCanvasRef.value.getCreatedArea();
      if (!area) return;
      // 确定是否可能需要封边
      const boundRect = area.getBoundRect();
      if (
        boundRect[0] === 0 ||
        boundRect[1] === 0 ||
        boundRect[0] + boundRect[2] >= Number(configRef.getSize.x) ||
        boundRect[1] + boundRect[3] >= Number(configRef.getSize.y)
      ) {
        const confirm = new Promise((resolve) => {
          awaitConfirmBound.value = resolve;
          confirmBoundModelRef.value?.setUpConfirmArea({
            data: area.getData(),
            boundRect: boundRect,
          });
        });
        const confirmData = (await confirm) as ImageData;
        if (!confirmData) return;
        area.setData(confirmData);
      }

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
  function handleConfirmBound(data: ImageData, cancel: boolean) {
    if (cancel) {
      awaitConfirmBound.value && awaitConfirmBound.value(null);
    } else {
      awaitConfirmBound.value && awaitConfirmBound.value(data);
    }
  }

  function handleLoadSaves(layers) {
    layersRef.value.forEach((layer) => {
      layer.areas.forEach((area) => {
        area.destroy();
      });
    });
    layersRef.value = layers;
  }

  function F5Check(e: KeyboardEvent) {
    if (e.key === 'F5') {
      e.preventDefault();
      modal.confirm({
        title: '确认',
        content: '刷新页面可能会导致数据丢失，请确认您已保存数据！',
        onOk: () => {
          location.reload();
        },
      });
    }
  }
  // 挂载时初始化
  onMounted(() => {
    window.addEventListener('keydown', F5Check);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', F5Check);
  });
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
    margin-right: 10px;
    padding-left: 30px;
    padding-top: 30px;
    background-color: rgb(51, 51, 51);
    transition: width 0.2s ease;
    &.full-screen {
      max-width: calc(100% - 60px);
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
      font-size: 20px;
    }
    .option-control-right {
      right: 400px;
    }
    .option-control-left {
      right: 150px;
    }
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
