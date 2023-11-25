import { useEditorConfig } from '@/store/modules/editor-config';
import controller from '../common/canvas-state-controller';
import DrawElement from './draw-element';
import { getShortUuid } from '@/utils/uuid';
import { scaleImageData } from '../utils/image-data-util';

export default class Pathway extends DrawElement {
  // rect 内的data
  public data: ImageData;

  constructor(name: string, data: ImageData, boundRect: Box, uuid?: string) {
    super();
    this.uuid = uuid || getShortUuid();
    this.name = name;
    this.data = data;
    if (Array.isArray(boundRect)) {
      this.boundRect = boundRect;
    } else {
      this.boundRect = [boundRect[0], boundRect[1], boundRect[2], boundRect[3]];
    }
  }
  getImage() {
    // 获取图片展示(延迟获取，因为创建时不知道名称)
    const cacheCanvas = document.createElement('canvas');
    const boundRect = this.getActualBoundRect();
    cacheCanvas.width = boundRect[2];
    cacheCanvas.height = boundRect[3];
    const cacheCtx = cacheCanvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    cacheCtx.putImageData(this.getData(), 0, 0);
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
  getActualBoundRect(): Box {
    if (this.scale !== 1) {
      // 考虑缩放1
      const boundRect = <Box>this.boundRect.slice();
      boundRect[2] = this.boundRect[2] * this.scale;
      boundRect[3] = this.boundRect[3] * this.scale;
      return boundRect;
    } else {
      return this.boundRect;
    }
  }

  render(target: HTMLElement) {
    // 创建挂载的dom元素
    const instance = document.createElement('div');
    instance.setAttribute('id', this.uuid);
    instance.setAttribute('class', 'moveable');
    const boundRect = this.getActualBoundRect();
    const left = 'left: ' + boundRect[0] + 'px;';
    const top = 'top: ' + boundRect[1] + 'px;';
    const width = 'width: ' + boundRect[2] + 'px;';
    const height = 'height: ' + boundRect[3] + 'px;';
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
      controller.setCurrentPathway(this);
    };
    instance.oncontextmenu = () => {
      controller.setCurrentPathway(this);
    };
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
