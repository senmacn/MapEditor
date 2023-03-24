import { CanvasInstance } from "../hooks/useCanvas";

export interface Layer {
  uuid: string;
  name: string;
  level: number;
  visible: boolean;
  map: string | ArrayBuffer | null;
  ctx?: CanvasInstance;
}