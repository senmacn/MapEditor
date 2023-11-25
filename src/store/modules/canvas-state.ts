import type { Layer } from '@/views/default-editor/common/types';
import type { Area, Pin, Pathway } from '@/views/default-editor/draw-element';
import { defineStore } from 'pinia';

interface CanvasState {
  layers: Layer[];
  areaMap: Map<string, Area>;
  pinMap: Map<string, Pin>;
  pathwayMap: Map<string, Pathway>;
  offset: {
    x: number;
    y: number;
  };
}

export const useCanvasState = defineStore({
  id: 'canvas-state',
  state: (): CanvasState => ({
    layers: [],
    areaMap: new Map(),
    pinMap: new Map(),
    pathwayMap: new Map(),
    offset: {
      x: 0,
      y: 0,
    },
  }),
  getters: {
    getAreaMap(): Map<string, Area> {
      return this.areaMap;
    },
    getPinMap(): Map<string, Pin> {
      return this.pinMap;
    },
    getPathwayMap(): Map<string, Pathway> {
      return this.pathwayMap;
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
      const pinMap = new Map();
      layers.forEach((layer) => layer.pins.forEach((pin) => pinMap.set(pin.getUuid(), pin)));
      this.pinMap = pinMap;
      const pathwayMap = new Map();
      layers.forEach((layer) => layer.pathways.forEach((pathway) => pathwayMap.set(pathway.getUuid(), pathway)));
      this.pathwayMap = pathwayMap;
      // @ts-ignore TODO: execute
      this.layers = layers;
    },
  },
});
