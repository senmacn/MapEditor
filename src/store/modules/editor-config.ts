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
    x: 2000,
    y: 2000,
  },
};
Object.keys(editorConfig).forEach((key) => {
  const storage = localStorage.getItem('editor-config-' + key);
  if (storage) {
    if (typeof editorConfig[key] === 'number') {
      editorConfig[key] = Number(JSON.parse(storage));
    } else {
      editorConfig[key] = JSON.parse(storage);
    }
  }
});

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
  },
  actions: {
    setStyle(value: Recordable<string>) {
      localStorage.setItem('editor-config-style', JSON.stringify(value));
      this.style = value;
    },
    setZoom(value: number) {
      localStorage.setItem('editor-config-zoom', JSON.stringify(value));
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
  },
});
