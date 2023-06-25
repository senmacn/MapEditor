import { getShortUuid } from '@/utils/uuid';
import controller from '../common/canvas-state-controller';
import { nextTick } from 'vue';
import DrawElement from './draw-element';
import { useTooltip } from '@/components/Tooltip/useTooltip';

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
  private author: string;

  private state: string;

  private jira: string;

  private icon: PinIcon;

  constructor(
    name: string,
    author: string,
    description: string,
    type: string,
    state: string,
    jira: string,
    position: PointA,
    size: number,
    icon: PinIcon,
  ) {
    super();
    this.uuid = getShortUuid();
    this.name = name;
    this.author = author;
    this.description = description;
    this.type = type;
    this.state = state;
    this.icon = icon;
    this.jira = jira;
    this.boundRect = [position.x, position.y, size, size];
  }

  setName(name): void {
    this.name = name;
  }
  setAuthor(author: string): void {
    this.author = author;
  }
  setDescription(description: string): void {
    this.description = description;
  }
  setType(type: string): void {
    this.type = type;
  }
  setState(state: string): void {
    this.state = state;
  }
  setIcon(icon: PinIcon): void {
    this.icon = icon;
  }
  setJira(jira: string): void {
    this.jira = jira;
  }
  render(target: HTMLElement) {
    // 创建挂载的dom元素
    const instance = document.createElement('div');
    instance.setAttribute('id', this.uuid);
    instance.setAttribute('class', 'moveable');
    const left = 'left: ' + this.boundRect[0] + 'px;';
    const top = 'top: ' + this.boundRect[1] + 'px;';
    instance.setAttribute('style', top + left);
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

    if (this.draw === 'update') {
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

    useTooltip({ target: instance, props: { title: this.name } });
  }
  select() {
    if (controller.getCurrentPin() === this) return;
    this.moveable?.updateRect();
    nextTick(() => {
      controller.setCurrentPin(this as unknown as Pin);
      this.moveable?.setState({ draggable: true });
      // @ts-ignore
      document.getElementsByClassName(this.uuid).item(0).style.visibility = 'visible';
    });
  }
}
