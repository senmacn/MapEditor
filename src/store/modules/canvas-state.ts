import type { Layer } from '@/views/default-editor/common/types';
import type { Area } from '@/views/default-editor/draw-element';
import { defineStore } from 'pinia';

interface CanvasState {
  layers: Layer[];
  areaMap: Map<String, Area>;
  offset: {
    x: number;
    y: number;
  };
}

export const useCanvasState = defineStore({
  id: 'canvas-state',
  state: (): CanvasState => ({
    layers: [] as Layer[],
    areaMap: new Map(),
    offset: {
      x: 0,
      y: 0,
    },
  }),
  getters: {
    getAreaMap(): Map<String, Area> {
      return this.areaMap;
    },
    getOffset(): Offset {
      return this.offset;
    },
    getLayers(): Layer[] {
      return this.layers as Layer[];
    },
  },
  actions: {
    setOffset(offset: Offset) {
      this.offset = offset;
    },
    setLayers(layers: Layer[]) {
      // 构建areaMap
      const map = new Map();
      layers.forEach((layer) => layer.areas.forEach((area) => map.set(area.getUuid(), area)));
      this.areaMap = map;
      this.layers = layers;
    },
  },
});
