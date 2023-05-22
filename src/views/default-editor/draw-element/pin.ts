import { getShortUuid } from '@/utils/uuid';
import controller from '../common/canvas-state-controller';
import { nextTick, render } from 'vue';
import DrawElement from './draw-element';

export enum PinIcon {
  star = 'star',
  more = 'more',
  chest = 'chest',
  backpack = 'backpack',
  book = 'book',
  animal = 'animal',
  monster = 'monster',
  special = 'special',
  world = 'world',
}

export default class Pin extends DrawElement {
  private level: number;

  private color: string;

  private icon: PinIcon;

  constructor(
    name: string,
    description: string,
    level: number,
    color: string,
    position: PointA,
    size: number,
    icon: PinIcon,
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
  setIcon(icon: PinIcon): void {
    this.icon = icon;
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
    const imgElement = document.createElement('img');
    imgElement.setAttribute('src', 'src/assets/images/' + this.icon + '.png');
    imgElement.setAttribute('width', this.boundRect[2] + 'px');
    imgElement.setAttribute('height', this.boundRect[2] + 'px');

    instance.appendChild(imgElement);
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
