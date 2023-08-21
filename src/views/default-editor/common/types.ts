import { Area, Pin } from '../draw-element';

export interface CanvasExtendImp {
  setupCanvas: (
    width: number,
    height: number,
    childrenCanvas: [HTMLCanvasElement, HTMLCanvasElement, HTMLCanvasElement, HTMLCanvasElement],
  ) => void;
  putSave: () => void;
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
  drawImageData(imageData: ImageData, offsetX: number, offsetY: number, width: number, height: number): Promise<void>;
  destroy: () => void;
}

export interface Layer {
  uuid: string;
  name: string;
  lock: boolean;
  visible: boolean;
  map: string | ArrayBuffer | null;
  hot: boolean;
  areas: Area[];
  pins: Pin[];
  transparency?: number;
}
