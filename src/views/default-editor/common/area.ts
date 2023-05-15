import Moveable from 'moveable';
import { getShortUuid } from '@/utils/uuid';
import controller from './canvas-state-controller';
import { nextTick } from 'vue';
import { getPosition } from './image-data-util';
import { renderSvg } from '@/utils/svg';

interface DrawElementInterface {
  select(...args: any): void;
  cancelSelect(...args: any): void;
  render(...args: any): void;
  destroy(...args: any): void;
  getImage(...args: any): any;
}

export class DrawElement implements DrawElementInterface {
  protected uuid;
  protected name;
  protected description;

  protected boundRect: Box = [0, 0, 0, 0];

  // 渲染的图片
  protected img;
  // 渲染的实例
  protected instance: HTMLElement | undefined;
  protected moveable: Moveable | undefined;
  // 实例父级
  protected target: HTMLElement | undefined;
  private draw = false;

  getUuid() {
    return this.uuid;
  }
  isSame(area: Partial<DrawElement>) {
    return area.getUuid && area.getUuid() === this.uuid;
  }
  getName() {
    return this.name;
  }
  setName(value: string) {
    this.name = value;
  }
  getBoundRect() {
    return this.boundRect;
  }
  setBoundRect(value: Box) {
    this.boundRect = value;
  }
  getDrawAreaComplete() {
    return this.draw;
  }
  drawAreaComplete() {
    this.draw = true;
  }
  getImage() {}
  select() {}
  cancelSelect() {
    this.moveable?.setState({ draggable: false });
    // 插件修改draggable的时候会显示外框，造成被选中的效果，需要移除
    setTimeout(() => {
      // @ts-ignore
      document.getElementsByClassName(this.uuid).item(0).style.visibility = 'hidden';
    }, 5);
  }
  render(target: HTMLElement) {}
  wrapperMoveable() {
    // 创建moveable
    const container = document.getElementById('scroller') as HTMLElement;
    this.moveable = new Moveable(container, {
      target: this.instance,
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
      });
    // 刚渲染完未被点击时不允许拖拽
    setTimeout(() => {
      this.cancelSelect();
    }, 5);
  }
  destroy() {
    this.instance && this.target?.removeChild(this.instance);
    this.moveable?.destroy();
  }
}

export class Area extends DrawElement {
  private boundRectPoints: Point[] | undefined;
  // rect 内的data
  private data: ImageData;

  constructor(name: string, data: ImageData, boundRect: Box) {
    super();
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
    const dataUrl = cacheCanvas.toDataURL('image/webp', 0.1);
    this.img = dataUrl;
    return this.img;
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
  // 获取区域轮廓点
  getBoundRectPoints() {
    if (!this.boundRectPoints) {
      const points = getPosition(this.data);
      points.forEach((point) => {
        point[0] = point[0] + this.boundRect[0];
        point[1] = point[1] + this.boundRect[1];
      });
      this.boundRectPoints = points;
    }
    return this.boundRectPoints;
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
    const backgroundImage =
      'background-image: ' + 'url(' + this.getImage() + ');background-size: contain';
    instance.setAttribute('style', top + left + height + width + backgroundImage);
    // TODO: hover
    // instance.onmouseenter = ;
    // instance.onmouseleave = ;

    // TODO: onclick 右键

    instance.ondblclick = this.select.bind(this);
    instance.oncontextmenu = this.select.bind(this);
    target.appendChild(instance);
    this.instance = instance;

    this.wrapperMoveable();
  }
  select() {
    if (controller.getCurrentArea() === this) return;
    // 先重置，否则mask-area的offset会错误
    controller.setCurrentArea(null);
    nextTick(() => {
      // TODO: Pin error
      controller.setCurrentArea(this as unknown as Area);
      // @ts-ignore
      document.getElementsByClassName(this.uuid).item(0).style.visibility = 'visible';
      this.moveable?.setState({ draggable: true });
    });
  }
}

export class Pin extends DrawElement {
  private level: number;
  private color: string;
  private icon: string;

  constructor(
    name: string,
    description: string,
    level: number,
    color: string,
    position: PointA,
    size: number,
    icon: string,
  ) {
    super();
    this.uuid = getShortUuid();
    this.name = name;
    this.description = description;
    this.level = level;
    this.icon = icon;
    this.color = color;
    this.boundRect = [position.x, position.y, size, size];
  }

  setName(name): void {
    this.name = name;
  }
  setDescription(description: string): void {
    this.description = description;
  }
  setLevel(level: number): void {
    this.level = level;
  }
  setColor(color: string): void {
    this.color = color;
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
    instance.setAttribute('style', top + left + height + width);
    setTimeout(() => {
      renderSvg(instance, this.icon, { color: this.color, size: this.boundRect[2] });
    });
    // TODO: hover
    // instance.onmouseenter = ;
    // instance.onmouseleave = ;

    // TODO: onclick 右键

    instance.ondblclick = this.select.bind(this);
    instance.oncontextmenu = this.select.bind(this);
    target.appendChild(instance);
    this.instance = instance;

    this.wrapperMoveable();
  }
  select() {
    if (controller.getCurrentPin() === this) return;
    nextTick(() => {
      controller.setCurrentPin(this as unknown as Pin);
      this.moveable?.setState({ draggable: true });
      // @ts-ignore
      document.getElementsByClassName(this.uuid).item(0).style.visibility = 'visible';
    });
  }
}
