import Area from './area';

export interface CanvasExtendImp {
  setupCanvas: (canvas: CanvasRenderingContext2D) => void;
  save: () => void;
  redo: () => void;
  undo: () => void;
  clean: (props?: Box) => void;
  erase(point: PointA, isLast?: boolean): void;
  drawSmoothLine: (beginPoint: PointA, controlPoint: PointA, endPoint: PointA) => void;
  drawLine: (beginPoint: PointA, endPoint: PointA) => void;
  drawCircle: (point: PointA, radius: number, fill?: boolean) => void;
  drawRect: (beginPoint: PointA, endPoint: PointA, fill?: boolean) => void;
  drawText: (point: PointA, text: string) => void;
  getImageData: (props?: [number, number, number, number]) => ImageData;
  mixin: (area: Area) => boolean;
}

export interface Layer {
  uuid: string;
  name: string;
  // 没啥用，待删除
  level: number;
  visible: boolean;
  map: string | ArrayBuffer | null;
  hot: boolean;
  areas: Area[];
  ctx?: CanvasExtendImp;
}
