<template>
  <div class="map-editor">
    <div :class="hideOptionRef ? 'content-box full-screen' : 'content-box'">
      <div class="scroller">
        <template v-for="layer in layersRef">
          <map-canvas :layer="layer" v-show="layer.visible" />
        </template>
        <mask-canvas v-if="visibleRef" />
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
      <map-options @update-style="handleUpdateStyle" @update-config="handleUpdateConfig" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { provide, reactive, ref, watch } from 'vue';
  import AButton from '@arco-design/web-vue/es/button';
  import mapCanvas from './default-canvas.vue';
  import maskCanvas from './mask-canvas.vue';
  import mapOptions from './default-options.vue';
  import { CanvasConfig, createCanvasConfigContext } from './hooks/useCanvasConfig';
  import { getRandomDomId } from '../../utils/uuid';
  import controller, { CanvasOption } from './common/canvas-controller';
  import { useToggle } from '@vueuse/core';
  import { Layer } from './common/types';

  const layersRef = ref<Layer[]>([
    {
      uuid: getRandomDomId(),
      name: '默认图层',
      level: 1,
      visible: true,
      map: null,
    },
  ]);
  provide('layers', layersRef);

  const canvasConfigRef = reactive<CanvasConfig>({
    style: {},
    zoom: 1,
    color: 'red',
    density: 1,
    autoConnect: true,
  });
  createCanvasConfigContext(canvasConfigRef);

  function handleUpdateStyle(key: string, value: string) {
    canvasConfigRef.style[key] = value;
  }

  function handleUpdateConfig(key: string, value: any) {
    canvasConfigRef[key] = value;
  }

  const visibleRef = ref(false);
  watch(
    () => controller.getState(),
    () => {
      if (controller.getState() === CanvasOption.DrawLine) {
        visibleRef.value = true;
      } else {
        visibleRef.value = false;
      }
    },
  );

  const [hideOptionRef, changeHideState] = useToggle(false);
</script>

<style lang="less">
  .map-editor {
    display: flex;
    height: 100%;
    background-color: var(--color-bg-1);
    margin-bottom: 10px;
  }
  .content-box {
    flex: 1;
    border: 1px solid #cccccc;
    margin: 10px;
    max-width: calc(100vw - 484px);
    padding: 10px;
    &.full-screen {
      max-width: 96vw;
    }
  }

  .scroller {
    position: relative;
    height: 100%;
    width: 100%;
    padding: 5px;
    overflow: auto;
  }
  .option-box {
    position: relative;
    width: 400px;
    margin: 10px;
    padding: 10px;
    border: 1px solid #cccccc;
    &.hide {
      width: 0;
      position: absolute;
      right: -500px;
    }
  }
  .option-control {
    position: absolute;
    top: 40%;
    background: white;
    cursor: pointer;
  }
  .option-control-right {
    right: 406px;
  }
  .option-control-left {
    position: absolute;
    right: 495px;
  }
</style>
