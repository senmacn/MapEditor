export type CanvasConfig = {
  [K: string]: Recordable<string> | string | number | boolean;
  style: Recordable<string>;
  density: number;
  color: string;
  lineWidth: number;
  zoom: number;
  autoConnect: boolean;
};

export interface CanvasExtendImp {
  setupCanvas: (canvas: CanvasRenderingContext2D, config?: CanvasConfig) => void;
  save: () => void;
  redo: () => void;
  undo: () => void;
  clean: () => void;
  erase(point: PointA, isLast?: boolean): void;
  drawSmoothLine: (beginPoint: PointA, controlPoint: PointA, endPoint: PointA) => void;
  drawLine: (beginPoint: PointA, endPoint: PointA) => void;
  drawDashLine: (beginPoint: PointA, endPoint: PointA) => void;
  getImageData: () => ImageData;
};

export interface Layer {
  uuid: string;
  name: string;
  // 没啥用，待删除
  level: number;
  visible: boolean;
  map: string | ArrayBuffer | null;
  hot: boolean;
  ctx?: CanvasExtendImp;
  keep?: boolean;
}