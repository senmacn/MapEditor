<template>
  <div class="map-editor">
    <map-canvas :filledMap="filledMapRef" :map="mapFileRef" />
    <map-options
      :filledMap="filledMapRef"
      @update-style="handleUpdateStyle"
      @update-zoom="handleUpdateZoom"
      @update-density="handleUpdateDensity"
      @update-mapFile="(file) => (mapFileRef = file)"
    />
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import mapCanvas from './grid-canvas.vue';
  import mapOptions from './grid-options.vue';
  import { CanvasConfig, createCanvasConfigContext } from './context/useCanvasConfig';
  import { GRID_SIZE } from './common/config';

  const filledMapRef = reactive<Map<string, boolean>>(new Map());
  const mapFileRef = ref();

  const canvasConfigRef = reactive<CanvasConfig>({
    gridSize: GRID_SIZE,
    style: {},
    zoom: 1,
    density: 1,
  });
  createCanvasConfigContext(canvasConfigRef);

  function handleUpdateStyle(key: string, value: string) {
    canvasConfigRef.style[key] = value;
  }

  function handleUpdateZoom(zoom: number) {
    canvasConfigRef.zoom = zoom;
    canvasConfigRef.gridSize = GRID_SIZE * zoom;
  }

  function handleUpdateDensity() {}
</script>

<style lang="less">
  .map-editor {
    display: flex;
    height: 100%;
    background-color: var(--color-bg-1);
    margin-bottom: 10px;
  }
</style>
