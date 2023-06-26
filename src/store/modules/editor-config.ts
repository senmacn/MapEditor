import { isLocal } from '@/utils/env';
import { isNullOrUnDef } from '@/utils/is';
import { defineStore } from 'pinia';

export interface EditorConfig {
  [K: string]: Recordable<any> | string | number | boolean;
  style: Recordable<string>;
  color: string;
  lineWidth: number;
  eraseSize: number;
  zoom: number;
  autoConnect: boolean;
  autoConnectScope: number;
  size: Recordable<number>;
  mapSize: Recordable<number>;
}

const editorConfig: EditorConfig = {
  style: {},
  zoom: 1,
  color: 'red',
  lineWidth: 1,
  eraseSize: 10,
  autoConnect: true,
  autoConnectScope: 24,
  size: {
    scale: 100,
    x: 2048,
    y: 2048,
    offsetX: 0,
    offsetY: 0,
    allX: 2048,
    allY: 2048,
  },
  mapSize: {
    used: 0,
    map_ltX: 0,
    map_ltY: 0,
    map_rbX: 0,
    map_rbY: 0,
    ltX: 0,
    ltY: 0,
    rbX: 0,
    rbY: 0,
  },
};
// 非本地端使用localstorage
if (!isLocal()) {
  Object.keys(editorConfig).forEach((key) => {
    const storage = localStorage.getItem('editor-config-' + key);
    if (storage) {
      if (typeof editorConfig[key] === 'number') {
        editorConfig[key] = Number(JSON.parse(storage));
      } else {
        if (!isNullOrUnDef(storage)) {
          editorConfig[key] = JSON.parse(storage);
        }
      }
    }
  });
}

export const useEditorConfig = defineStore({
  id: 'editor-config',
  state: (): EditorConfig => editorConfig,
  getters: {
    getStyle(): Recordable<string> {
      return this.style;
    },
    getZoom(): number {
      return this.zoom;
    },
    getColor(): string {
      return this.color;
    },
    getLineWidth(): number {
      return this.lineWidth;
    },
    getEraseSize(): number {
      return this.eraseSize;
    },
    getAutoConnect(): boolean {
      return this.autoConnect;
    },
    getAutoConnectScope(): number {
      return this.autoConnectScope;
    },
    getSize(): Recordable<number> {
      return this.size;
    },
    getMapSize(): Recordable<number> {
      return this.mapSize;
    },
  },
  actions: {
    setAll(_editorConfig: EditorConfig) {
      this.style = _editorConfig.style;
      // this.zoom = _editorConfig.zoom;
      this.color = _editorConfig.color;
      this.lineWidth = _editorConfig.lineWidth;
      this.eraseSize = _editorConfig.eraseSize;
      this.autoConnect = _editorConfig.autoConnect;
      this.autoConnectScope = _editorConfig.autoConnectScope;
      this.size = _editorConfig.size;
      this.mapSize = _editorConfig.mapSize;
    },
    setStyle(value: Recordable<string>) {
      localStorage.setItem('editor-config-style', JSON.stringify(value));
      this.style = value;
    },
    setZoom(value: number) {
      // localStorage.setItem('editor-config-zoom', JSON.stringify(value));
      this.zoom = value;
    },
    setColor(value: string) {
      localStorage.setItem('editor-config-color', JSON.stringify(value));
      this.color = value;
    },
    setLineWidth(value: number) {
      localStorage.setItem('editor-config-lineWidth', JSON.stringify(value));
      this.lineWidth = value;
    },
    setEraseSize(value: number) {
      localStorage.setItem('editor-config-eraseSize', JSON.stringify(value));
      this.eraseSize = value;
    },
    setAutoConnect(value: boolean) {
      localStorage.setItem('editor-config-autoConnect', JSON.stringify(value));
      this.autoConnect = value;
    },
    setAutoConnectScope(value: number) {
      localStorage.setItem('editor-config-autoConnectScope', JSON.stringify(value));
      this.autoConnectScope = value;
    },
    setSize(value: Recordable) {
      localStorage.setItem('editor-config-size', JSON.stringify(value));
      this.size = value;
    },
    setMapSize(value: Recordable) {
      localStorage.setItem('editor-config-mapSize', JSON.stringify(value));
      this.mapSize = value;
    },
  },
});
