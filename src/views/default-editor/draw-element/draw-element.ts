import type { Layer } from '../common/types';
import Moveable from 'moveable';
import controller, { AreaActionType } from '../common/canvas-state-controller';

export interface DrawElementInterface {
  select(...args: any): void;
  cancelSelect(...args: any): void;
  render(...args: any): void;
  destroy(...args: any): void;
  getImage(...args: any): any;
  show(): void;
  hide(): void;
}

type DrawType = 'done' | 'update' | 'none';

export default class DrawElement implements DrawElementInterface {
  protected uuid: string = '';
  protected name: string = '';
  protected description: string = '';
  // @json-delete
  public layer: Layer | undefined;
  protected boundRect: Box = [0, 0, 0, 0];
  // @json-delete 渲染的图片
  protected img;
  // @json-delete 渲染的实例
  public instance: HTMLElement | undefined;
  // @json-delete
  public moveable: Moveable | undefined;
  // @json-delete 实例父级
  public target: HTMLElement | undefined;
  public draw: DrawType = 'none';
  // @json-delete
  public scale = 1;
  public type: string = '';
  public visible = true;
  protected selected = false;

  getUuid() {
    return this.uuid;
  }
  setUuid(uuid) {
    this.uuid = uuid;
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
    return this.draw !== 'none';
  }
  getDrawAreaUpdate() {
    return this.draw === 'update';
  }
  drawAreaComplete() {
    this.draw = 'done';
  }
  getImage() {}
  select() {}
  cancelSelect() {
    if (!this.selected) {
      return;
    }
    if (this.moveable?.draggable) {
      this.moveable?.setState({ draggable: false, resizable: false });
      // 插件修改draggable的时候会显示外框，造成被选中的效果，需要移除
      setTimeout(() => {
        // @ts-ignore
        document.getElementsByClassName(this.uuid).item(0).style.visibility = 'hidden';
      }, 5);
    }
    this.selected = false;
  }
  render(_: HTMLElement) {}
  show() {
    if (this.instance) {
      this.instance.style.display = 'block';
    }
  }
  hide() {
    if (this.instance) {
      this.instance.style.display = 'none';
    }
  }
  wrapperMoveable() {
    // 创建moveable
    const container = document.getElementById('scroller') as HTMLElement;
    this.moveable = new Moveable(container, {
      target: this.instance,
      container: container,
      className: this.uuid,
      draggable: true,
      resizable: true,
      keepRatio: true,
      preventDefault: true,
      origin: false,
      throttleDrag: 0,
      throttleResize: 0,
      throttleScale: 0,
      throttleRotate: 0,
    });
    let dragState: number[] = [];
    /* draggable */
    this.moveable
      .on('dragStart', () => {
        dragState = [this.boundRect[0], this.boundRect[1]];
      })
      .on('drag', ({ target, left, top }) => {
        target.style.left = `${left}px`;
        target.style.top = `${top}px`;
      })
      .on('dragEnd', ({ target }) => {
        this.boundRect[0] = parseInt(target.style.left.replace('px', ''));
        this.boundRect[1] = parseInt(target.style.top.replace('px', ''));
        // 记录历史
        controller.pushAction({
          key: new Date().getTime().toString(),
          uuid: this.uuid,
          type: AreaActionType.MOVE,
          state: dragState.slice() as [number, number],
        });
      })
      .on('resize', ({ target, width, height }) => {
        target.style.width = `${width}px`;
        target.style.height = `${height}px`;
      })
      .on('resizeEnd', ({ target }) => {
        controller.pushAction({
          key: new Date().getTime().toString(),
          uuid: this.uuid,
          type: AreaActionType.SCALE,
          state: this.scale,
        });
        // 自动对齐整数
        const newWidth = parseInt(target.style.width.replace('px', ''));
        const newHeight = parseInt(target.style.height.replace('px', ''));
        this.scale = Number((newWidth / this.boundRect[2]).toFixed(2));
        target.style.width = `${newWidth}px`;
        target.style.height = `${newHeight}px`;
      });
    // 刚渲染完未被点击时不允许拖拽
    setTimeout(() => {
      this.selected = true;
      this.cancelSelect();
    }, 5);
  }
  destroy() {
    this.instance && this.target?.removeChild(this.instance);
    this.moveable?.destroy();
  }
}
