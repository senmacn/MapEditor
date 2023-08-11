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
  projectSizeConfig: ProjectSizeConfig;
}

const editorConfig: EditorConfig = {
  style: {},
  zoom: 1,
  color: 'red',
  lineWidth: 1,
  eraseSize: 10,
  autoConnect: true,
  autoConnectScope: 24,
  projectSizeConfig: {
    Sn: '',
    startPointX: 0,
    startPointY: 0,
    mapWidth: 100800,
    mapHeight: 100800,
    actorWidth: 25200,
    actorPxWidth: 1024,
    offsetX: 0,
    offsetY: 0,
    offsetWidth: 25200,
    offsetHeight: 25200,
  },
  size: {},
  mapSize: {},
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
    getProjectSizeConfig(): ProjectSizeConfig {
      return this.projectSizeConfig;
    },
    getProjectSizeConfigScale(): number {
      return this.projectSizeConfig.actorWidth / this.projectSizeConfig.actorPxWidth;
    },
    getProjectSizeConfigFullHeight(): number {
      return (
        (this.projectSizeConfig.mapHeight / this.projectSizeConfig.actorWidth) *
        this.projectSizeConfig.actorPxWidth
      );
    },
    getProjectSizeConfigPxOffsetY(): number {
      return (
        ((this.projectSizeConfig.offsetY - this.projectSizeConfig.startPointY) /
          this.projectSizeConfig.actorWidth) *
        this.projectSizeConfig.actorPxWidth
      );
    },
    getProjectSizeConfigPxHeight(): number {
      return (
        (this.projectSizeConfig.offsetHeight / this.projectSizeConfig.actorWidth) *
        this.projectSizeConfig.actorPxWidth
      );
    },
    getProjectSizeConfigFullWidth(): number {
      return (
        (this.projectSizeConfig.mapWidth / this.projectSizeConfig.actorWidth) *
        this.projectSizeConfig.actorPxWidth
      );
    },
    getProjectSizeConfigPxOffsetX(): number {
      return (
        ((this.projectSizeConfig.offsetX - this.projectSizeConfig.startPointX) /
          this.projectSizeConfig.actorWidth) *
        this.projectSizeConfig.actorPxWidth
      );
    },
    getProjectSizeConfigPxWidth(): number {
      return (
        (this.projectSizeConfig.offsetWidth / this.projectSizeConfig.actorWidth) *
        this.projectSizeConfig.actorPxWidth
      );
    },
  },
  actions: {
    setAll(_editorConfig: EditorConfig) {
      // this.style = _editorConfig.style;
      // this.zoom = _editorConfig.zoom;
      this.color = _editorConfig.color;
      this.lineWidth = _editorConfig.lineWidth;
      this.eraseSize = _editorConfig.eraseSize;
      this.autoConnect = _editorConfig.autoConnect;
      this.autoConnectScope = _editorConfig.autoConnectScope;
      // 兼容旧数据，转换一下
      if (_editorConfig.mapSize && _editorConfig.size && !_editorConfig.projectSizeConfig) {
        let projectSizeConfig;
        if (_editorConfig.mapSize.used) {
          projectSizeConfig = {
            Sn: '',
            startPointX: _editorConfig.mapSize.map_ltX,
            startPointY: _editorConfig.mapSize.map_ltY,
            mapWidth: _editorConfig.size.allX * _editorConfig.size.scale,
            mapHeight: _editorConfig.size.allY * _editorConfig.size.scale,
            actorWidth: 1024 * _editorConfig.size.scale,
            actorPxWidth: 1024,
            offsetX:
              _editorConfig.mapSize.map_ltX + _editorConfig.size.offsetX * _editorConfig.size.scale,
            offsetY:
              _editorConfig.mapSize.map_ltY + _editorConfig.size.offsetY * _editorConfig.size.scale,
            offsetWidth: _editorConfig.size.x * _editorConfig.size.scale,
            offsetHeight: _editorConfig.size.y * _editorConfig.size.scale,
          };
        } else {
          projectSizeConfig = {
            Sn: '',
            startPointX: 0,
            startPointY: 0,
            mapWidth: _editorConfig.size.allX * _editorConfig.size.scale,
            mapHeight: _editorConfig.size.allY * _editorConfig.size.scale,
            actorWidth: 1024 * _editorConfig.size.scale,
            actorPxWidth: 1024,
            offsetX:
              _editorConfig.mapSize.map_ltX + _editorConfig.size.offsetX * _editorConfig.size.scale,
            offsetY:
              _editorConfig.mapSize.map_ltY + _editorConfig.size.offsetY * _editorConfig.size.scale,
            offsetWidth: _editorConfig.size.x * _editorConfig.size.scale,
            offsetHeight: _editorConfig.size.y * _editorConfig.size.scale,
          };
        }
        this.setProjectSizeConfig(projectSizeConfig);
      } else {
        _editorConfig.projectSizeConfig &&
          this.setProjectSizeConfig(_editorConfig.projectSizeConfig);
      }
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
    setProjectSizeConfig(projectSizeConfig: ProjectSizeConfig) {
      Object.keys(projectSizeConfig).forEach((key) => {
        projectSizeConfig[key] = Number(projectSizeConfig[key]);
      });
      this.projectSizeConfig = projectSizeConfig;
    },
  },
});
