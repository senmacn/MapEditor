import { defineStore } from 'pinia';

export interface EditorConfig {
  [K: string]: Recordable<any> | string | number | boolean;
  style: Recordable<string>;
  color: string;
  lineWidth: number;
  zoom: number;
  autoConnect: boolean;
  size: Recordable<number>;
}

const editorConfig: EditorConfig = {
  style: {},
  zoom: 1,
  color: 'red',
  lineWidth: 1,
  autoConnect: true,
  size: {
    x: 1000,
    y: 1000,
  },
};
Object.keys(editorConfig).forEach((key) => {
  const storage = localStorage.getItem('editor-config-' + key);
  if (storage) {
    editorConfig[key] = JSON.parse(storage);
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
    getAutoConnect(): boolean {
      return this.autoConnect;
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
    setAutoConnect(value: boolean) {
      localStorage.setItem('editor-config-autoConnect', JSON.stringify(value));
      this.autoConnect = value;
    },
    setSize(value: Recordable) {
      localStorage.setItem('editor-config-size', JSON.stringify(value));
      this.size = value;
    },
  },
});
