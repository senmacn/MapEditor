import { getShortUuid } from '@/utils/uuid';

export default class Area {
  private uuid;
  private name: string;
  private draw = false;
  private data: ImageData;
  // x1 y1 width height
  private boundRect: Box = [0, 0, 0, 0];
  private borderPoint: Point[] = [];
  constructor(name: string, data: ImageData) {
    this.uuid = getShortUuid();
    this.name = name;
    this.data = data;
  }
  getUuid() {
    return this.uuid;
  }
  isSame(area: Partial<Area>) {
    return area.getUuid && area.getUuid() === this.uuid;
  }
  getName() {
    return this.name;
  }
  setName(value: string) {
    this.name = value;
  }
  get getDrawAreaComplete() {
    return this.draw;
  }
  drawAreaComplete() {
    this.draw = true;
  }
  getData() {
    return this.data;
  }
  setData(value: ImageData) {
    this.data = value;
  }
  getCenterPoint(): PointA {
    return {
      x: this.boundRect[0] + this.boundRect[2] / 2,
      y: this.boundRect[1] + this.boundRect[3] / 2,
    };
  }
  getBoundRect() {
    return this.boundRect;
  }
  setBoundRect(value: Box) {
    this.boundRect = value;
  }
  getBorderPoint() {
    return this.borderPoint;
  }
  setBorderPoint(value: Point[]) {
    this.borderPoint = value;
  }
  // 点是否在区域矩形轮廓内部
  checkPointInArea(point: PointA) {
    return (
      point.x > this.boundRect[0] &&
      point.x < this.boundRect[0] + this.boundRect[2] &&
      point.y > this.boundRect[1] &&
      point.y < this.boundRect[1] + this.boundRect[3]
    );
  }
}
