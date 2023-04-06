import { defineStore } from 'pinia';

export interface EditorConfig {
  [K: string]: Recordable<string> | string | number | boolean;
  style: Recordable<string>;
  color: string;
  lineWidth: number;
  zoom: number;
  autoConnect: boolean;
}

export const useEditorConfig = defineStore({
  id: 'editor-config',
  state: (): EditorConfig => ({
    style: {},
    zoom: 1,
    color: 'red',
    lineWidth: 1,
    autoConnect: true,
  }),
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
      this.style = value;
    },
    setZoom(value: number) {
      this.zoom = value;
    },
    setColor(value: string) {
      this.color = value;
    },
    setLineWidth(value: number) {
      this.lineWidth = value;
    },
    setAutoConnect(value: boolean) {
      this.autoConnect = value;
    },
  },
});
