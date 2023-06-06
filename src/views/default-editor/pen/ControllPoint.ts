import { useEditorConfig } from "@/store/modules/editor-config";

export default class ControlPoint {
  x: number;
  y: number;
  counterpart: ControlPoint | null = null;
  static ctx: CanvasRenderingContext2D;
  static CONTROL_POINT_RADIUS = 5;
  staticDistance: number = 0;

  constructor(x: number, y: number) {
    this.x = x || 0;
    this.y = y || 0;
  }

  draw() {
    ControlPoint.ctx.beginPath();
    ControlPoint.ctx.arc(this.x, this.y, ControlPoint.CONTROL_POINT_RADIUS, 0, 2 * Math.PI, false);
  }
  print() {
    this.draw();
    ControlPoint.ctx.save();
    ControlPoint.ctx.strokeStyle = useEditorConfig().getColor;
    ControlPoint.ctx.fillStyle = useEditorConfig().getColor;
    ControlPoint.ctx.stroke();
    ControlPoint.ctx.fill();
    ControlPoint.ctx.restore();
  }
  isInPoint(x, y) {
    this.draw();
    if (ControlPoint.ctx.isPointInPath(x, y)) {
      return true;
    }
    return false;
  }
}
