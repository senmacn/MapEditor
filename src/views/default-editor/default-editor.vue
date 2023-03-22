<template>
  <div class="map-editor">
    <div class="content-box">
      <div class="scroller" :style="canvasConfigRef.style">
        <map-canvas :map="mapFileRef" />
        <mask-canvas :map="mapFileRef" v-if="maskVisibleRef" />
      </div>
    </div>
    <map-options
      @update-style="handleUpdateStyle"
      @update-config="handleUpdateConfig"
      @update-mapFile="(file) => (mapFileRef = file)"
      @change-visible="changeVisible"
    />
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import mapCanvas from './default-canvas.vue';
  import maskCanvas from './mask-canvas.vue';
  import mapOptions from './default-options.vue';
  import { CanvasConfig, createCanvasConfigContext } from './hooks/useCanvasConfig';
  import { useToggle } from '@vueuse/core';

  const mapFileRef = ref();

  const canvasConfigRef = reactive<CanvasConfig>({
    style: {},
    zoom: 1,
    density: 1,
    autoConnect: true,
  });
  createCanvasConfigContext(canvasConfigRef);

  const [maskVisibleRef, changeVisible] = useToggle(false);

  function handleUpdateStyle(key: string, value: string) {
    canvasConfigRef.style[key] = value;
  }

  function handleUpdateConfig(key: string, value: any) {
    canvasConfigRef[key] = value;
  }
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
  }

  .scroller {
    position: relative;
    height: 100%;
    width: 100%;
    padding: 5px;
    overflow: auto;
    text-align: center;
  }
</style>
