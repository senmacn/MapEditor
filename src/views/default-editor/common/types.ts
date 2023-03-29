import { CanvasInstance } from "../hooks/useCanvas";

export interface Layer {
  uuid: string;
  name: string;
  // 没啥用，待删除
  level: number;
  visible: boolean;
  map: string | ArrayBuffer | null;
  hot: boolean;
  ctx?: CanvasInstance;
  keep?: boolean;
}