import { useEditorConfig } from '@/store/modules/editor-config';
import ControlPoint from './ControllPoint';

export default class EndPoint {
  x: number;
  y: number;
  selected = false;
  cp0: ControlPoint;
  cp1: ControlPoint;
  cpBalance = true;
  END_POINT_LENGTH: number = 5;
  MOUSE_CHECK_END_POINT_LENGTH = 10;
  static ctx: CanvasRenderingContext2D;
  constructor(x: number, y: number, cp0?: ControlPoint, cp1?: ControlPoint) {
    this.x = x || 0;
    this.y = y || 0;
    this.cp0 = cp0 || new ControlPoint(x, y);
    this.cp1 = cp1 || new ControlPoint(x, y);
  }

  draw(height) {
    height = height || this.END_POINT_LENGTH;
    EndPoint.ctx.beginPath();
    EndPoint.ctx.rect(this.x - height / 2, this.y - height / 2, height, height);
  }

  print() {
    this.draw(this.END_POINT_LENGTH);
    EndPoint.ctx.save();
    EndPoint.ctx.strokeStyle = useEditorConfig().getColor;
    EndPoint.ctx.stroke();
    if (this.selected) {
      EndPoint.ctx.fillStyle = useEditorConfig().getColor;
      EndPoint.ctx.fill();
    }
    EndPoint.ctx.restore();
  }
  printAndControlPoints() {
    this.print();
    if (!this.selected) return;
    if (this.cp0.x !== this.x || this.cp0.y !== this.y) {
      this.cp0.print();
      this.line(this.cp0.x, this.cp0.y, this.x, this.y, EndPoint.ctx);
    }
    if (this.cp1.x !== this.x || this.cp1.y !== this.y) {
      this.cp1.print();
      this.line(this.cp1.x, this.cp1.y, this.x, this.y, EndPoint.ctx);
    }
  }
  line(x: number, y: number, x1: number, y1: number, ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = useEditorConfig().getLineWidth;
    ctx.strokeStyle = useEditorConfig().getColor;
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  }
  isInPoint(x: number, y: number) {
    this.draw(this.MOUSE_CHECK_END_POINT_LENGTH);
    if (EndPoint.ctx.isPointInPath(x, y)) {
      return self;
    }
    if (this.selected) {
      if (this.cp0.isInPoint(x, y)) {
        return this.cp0;
      }
      if (this.cp1.isInPoint(x, y)) {
        return this.cp1;
      }
    }
    return false;
  }

  distanceFromControlPoint(controlPoint) {
    return Math.sqrt(Math.pow(this.x - controlPoint.x, 2) + Math.pow(this.y - controlPoint.y, 2));
  }

  calculateControlPoint(x: number, y: number, controlPoint) {
    if (this.cpBalance) {
      controlPoint.counterpart = controlPoint === this.cp0 ? this.cp1 : this.cp0;
      controlPoint.counterpart.staticDistance = controlPoint.counterpart.staticDistance
        ? controlPoint.counterpart.staticDistance
        : this.distanceFromControlPoint(controlPoint.counterpart);

      var staticDistance = controlPoint.counterpart.staticDistance;
      var dynamicDistance = this.distanceFromControlPoint(controlPoint);

      controlPoint.counterpart.x = (staticDistance / dynamicDistance) * (this.x - x) + this.x;
      controlPoint.counterpart.y = (staticDistance / dynamicDistance) * (this.y - y) + this.y;
    }
    controlPoint.x = x;
    controlPoint.y = y;
  }
}
