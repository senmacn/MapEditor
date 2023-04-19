import Moveable from 'moveable';
import { getShortUuid } from '@/utils/uuid';
import controller from './canvas-state-controller';
import { nextTick } from 'vue';
import { emitClickAreaEvent } from './event';

export default class Area {
  private uuid;
  private name: string;
  private draw = false;
  // 边框 x1 y1 width height
  private boundRect: Box = [0, 0, 0, 0];
  // rect 内的data
  private data: ImageData;
  // 渲染的图片
  private img;
  // 渲染的实例
  private instance: HTMLElement | undefined;
  private moveable: Moveable | undefined;
  // 实例父级
  private target: HTMLElement | undefined;
  constructor(name: string, data: ImageData, boundRect: Box) {
    this.uuid = getShortUuid();
    this.name = name;
    this.data = data;
    this.boundRect = boundRect;
  }
  getImage() {
    // 获取图片展示(延迟获取，因为创建时不知道名称；)
    const cacheCanvas = document.createElement('canvas');
    cacheCanvas.width = this.boundRect[2];
    cacheCanvas.height = this.boundRect[3];
    const cacheCtx = cacheCanvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    cacheCtx.putImageData(this.data, 0, 0);
    cacheCtx.font = '24px serif';
    cacheCtx.fillStyle = 'red';
    cacheCtx.fillText(this.name, this.boundRect[2] / 2, this.boundRect[3] / 2);
    const dataUrl = cacheCanvas.toDataURL('image/webp', 0.5);
    this.img = dataUrl;
    return this.img;
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
      point.x + offset.x > this.boundRect[0] &&
      point.x + offset.x < this.boundRect[0] + this.boundRect[2] &&
      point.y + offset.y > this.boundRect[1] &&
      point.y + offset.y < this.boundRect[1] + this.boundRect[3]
    );
  }
  select() {
    // 先重置，否则mask-area的offset会错误
    controller.setCurrentArea(null);
    nextTick(() => {
      controller.setCurrentArea(this);
      emitClickAreaEvent(this);
      // @ts-ignore
      document.getElementsByClassName(this.uuid).item(0).style.visibility = 'visible';
      this.moveable?.setState({ draggable: true });
    });
  }
  cancelSelect() {
    // @ts-ignore
    document.getElementsByClassName(this.uuid).item(0).style.visibility = 'hidden';
    this.moveable?.setState({ draggable: false });
  }
  render(target: HTMLElement) {
    this.target = target;
    // 创建挂载的dom元素
    const instance = document.createElement('div');
    instance.setAttribute('id', this.uuid);
    instance.setAttribute('class', 'moveable');
    const left = 'left: ' + this.boundRect[0] + 'px;';
    const top = 'top: ' + this.boundRect[1] + 'px;';
    const width = 'width: ' + this.boundRect[2] + 'px;';
    const height = 'height: ' + this.boundRect[3] + 'px;';
    const backgroundImage = 'background-image: ' + 'url(' + this.getImage() + ');';
    instance.setAttribute('style', top + left + height + width + backgroundImage);
    target.appendChild(instance);
    this.instance = instance;
    // 创建moveable
    const container = document.getElementById('scroller') as HTMLElement;
    this.moveable = new Moveable(container, {
      target: instance,
      container: container,
      className: this.uuid,
      draggable: true,
      preventDefault: true,
      origin: false,
      throttleDrag: 0,
      throttleResize: 0,
      throttleScale: 0,
      throttleRotate: 0,
    });
    /* draggable */
    this.moveable
      .on('drag', ({ target, left, top }) => {
        target!.style.left = `${left}px`;
        target!.style.top = `${top}px`;
      })
      .on('dragEnd', ({ target }) => {
        this.boundRect[0] = parseInt(target.style.left.replace('px', ''));
        this.boundRect[1] = parseInt(target.style.top.replace('px', ''));
      })
      // 在这里处理点击逻辑
      .on('click', ({ inputEvent }) => {
        inputEvent.stopPropagation();
        this.select();
      });
  }
  destroy() {
    this.instance && this.target?.removeChild(this.instance);
    this.moveable?.destroy();
  }
}
