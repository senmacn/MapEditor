import Area from './area';

export type CanvasInstance = CanvasExtendImp & CanvasRenderingContext2D;

export interface CanvasExtendImp {
  setupCanvas: (canvas: CanvasRenderingContext2D) => void;
  setOffset: (offset: Offset) => void;
  getOffset: () => Offset;
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
}

export interface Layer {
  uuid: string;
  name: string;
  visible: boolean;
  map: string | ArrayBuffer | null;
  hot: boolean;
  areas: Area[];
}
