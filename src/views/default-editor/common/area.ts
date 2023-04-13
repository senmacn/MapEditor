import { getShortUuid } from '@/utils/uuid';

export default class Area {
  private uuid;
  private name: string;
  private draw = false;
  // x1 y1 width height
  private boundRect: Box = [0, 0, 0, 0];
  // rect 内的data
  private data: ImageData;
  private offset: Offset;
  constructor(name: string, data: ImageData, offset: Offset) {
    this.uuid = getShortUuid();
    this.name = name;
    this.data = data;
    this.offset = offset;
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
  getOffset() {
    return this.offset;
  }
  getDrawAreaComplete() {
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
  // 点是否在区域矩形轮廓内部
  checkPointInArea(point: PointA, offset: Offset) {
    return (
      point.x + offset.x > this.boundRect[0] + this.offset.x &&
      point.x + offset.x < this.boundRect[0] + this.offset.x + this.boundRect[2] &&
      point.y + offset.y > this.boundRect[1] + this.offset.y &&
      point.y + offset.y < this.boundRect[1] + this.offset.y + this.boundRect[3]
    );
  }
}
