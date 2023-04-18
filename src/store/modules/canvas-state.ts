import { defineStore } from 'pinia';

export const useCanvasState = defineStore({
  id: 'canvas-state',
  state: () => ({
    offset: {
      x: 0,
      y: 0,
    },
  }),
  getters: {
    getOffset(): Offset {
      return this.offset;
    },
  },
  actions: {
    setOffset(offset: Offset) {
      this.offset = offset;
    },
  },
});
