import { Layer } from '@/views/default-editor/common/types';
import { defineStore } from 'pinia';

export const useCanvasState = defineStore({
  id: 'canvas-state',
  state: () => ({
    layers: [] as Layer[],
    offset: {
      x: 0,
      y: 0,
    },
  }),
  getters: {
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
      this.layers = layers;
    },
  },
});
