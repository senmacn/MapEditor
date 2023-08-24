import { getShortUuid } from '@/utils/uuid';
import { getPosition, scaleImageData } from '../utils/image-data-util';
import DrawElement from './draw-element';
import { useEditorConfig } from '@/store/modules/editor-config';
import controller from '../common/canvas-state-controller';

export default class Area extends DrawElement {
  // 手动选择的内部点，用于填充内容
  private choosePoint;
  private boundRectPoints: Point[] | undefined;
  // rect 内的data
  public data: ImageData;

  constructor(name: string, data: ImageData, boundRect: Box) {
    super();
    this.uuid = getShortUuid();
    this.name = name;
    this.data = data;
    if (Array.isArray(boundRect)) {
      this.boundRect = boundRect;
    } else {
      this.boundRect = [boundRect[0], boundRect[1], boundRect[2], boundRect[3]];
    }
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
    const dataUrl = cacheCanvas.toDataURL('image/webp', 0.5);
    this.img = dataUrl;
    return this.img;
  }
  // 使用数据时考虑
  getData() {
    // 考虑缩放
    if (this.scale !== 1) {
      return scaleImageData(this.data, this.scale);
    }
    return this.data;
  }
  // 使用数据时考虑
  getActualBoundRect() {
    if (this.scale !== 1) {
      // 考虑缩放
      const boundRect = this.boundRect.slice();
      boundRect[2] = this.boundRect[2] * this.scale;
      boundRect[3] = this.boundRect[3] * this.scale;
      return boundRect;
    } else {
      return this.boundRect;
    }
  }
  setChoosePoint(choosePoint: [number, number]) {
    this.choosePoint = choosePoint;
  }
  getChoosePoint() {
    if (this.scale !== 1) {
      // 考虑缩放
      const boundRect = this.boundRect.slice();
      boundRect[2] = this.boundRect[2] * this.scale;
      boundRect[3] = this.boundRect[3] * this.scale;
      return [Math.round(this.choosePoint[0] * this.scale), Math.round(this.choosePoint[1] * this.scale)];
    } else {
      return this.choosePoint;
    }
  }
  setData(value: ImageData) {
    // 重置缩放
    this.scale = 1;
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
      const points = getPosition(this.getData());
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
    // 创建挂载的dom元素
    const instance = document.createElement('div');
    instance.setAttribute('id', this.uuid);
    instance.setAttribute('class', 'moveable');
    const left = 'left: ' + this.boundRect[0] + 'px;';
    const top = 'top: ' + this.boundRect[1] + 'px;';
    const width = 'width: ' + this.boundRect[2] + 'px;';
    const height = 'height: ' + this.boundRect[3] + 'px;';
    const color = 'color: ' + useEditorConfig().color + ';';
    const backgroundImage = 'background-image: ' + 'url(' + this.getImage() + ');background-size: contain';
    instance.setAttribute('style', top + left + height + width + color + backgroundImage);
    const nameElement = document.createTextNode(this.name);
    instance.appendChild(nameElement);
    // TODO: hover
    // instance.onmouseenter = ;
    // instance.onmouseleave = ;

    // TODO: onclick 右键

    instance.ondblclick = () => {
      controller.setCurrentAreas([this]);
    };
    instance.oncontextmenu = this.select.bind(this, false);
    if (this.draw === 'update' || this.draw === 'done') {
      // 防止切换时target变了
      this.target?.removeChild(this.instance as HTMLElement);
      this.target = target;
      target.appendChild(instance);
      this.instance = instance;
      // @ts-ignore
      this.moveable.target = this.instance;
    } else if (this.draw === 'none') {
      this.target = target;
      target.appendChild(instance);
      this.instance = instance;
      this.wrapperMoveable();
    }

    // useTooltip({ target: instance, props: { title: this.name } });
  }
  select(silence?: boolean) {
    if (this.selected) {
      return;
    }    
    if (!silence) {
      // @ts-ignore
      document.getElementsByClassName(this.uuid).item(0).style.visibility = 'visible';
      this.moveable?.setState({ draggable: true, resizable: true });
      this.selected = true;
      this.instance?.click();
      this.moveable?.updateRect();
    }
  }
}
