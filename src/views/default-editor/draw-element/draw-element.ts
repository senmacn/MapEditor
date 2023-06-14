import Moveable from 'moveable';

interface DrawElementInterface {
  select(...args: any): void;
  cancelSelect(...args: any): void;
  render(...args: any): void;
  destroy(...args: any): void;
  getImage(...args: any): any;
  show(): void;
  hide(): void;
}

export default class DrawElement implements DrawElementInterface {
  protected uuid;
  protected name;
  protected description;

  protected boundRect: Box = [0, 0, 0, 0];

  // 渲染的图片
  protected img;
  protected type: string = '';
  // 渲染的实例
  protected instance: HTMLElement | undefined;
  protected moveable: Moveable | undefined;
  // 实例父级
  protected target: HTMLElement | undefined;
  protected draw = false;
  protected scale = 1;

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
    this.moveable?.setState({ draggable: false, resizable: false });
    // 插件修改draggable的时候会显示外框，造成被选中的效果，需要移除
    setTimeout(() => {
      // @ts-ignore
      document.getElementsByClassName(this.uuid).item(0).style.visibility = 'hidden';
    }, 5);
  }
  render(target: HTMLElement) {}
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
    const _this = this;
    /* draggable */
    this.moveable
      .on('drag', ({ target, left, top }) => {
        target.style.left = `${left}px`;
        target.style.top = `${top}px`;
      })
      .on('dragEnd', ({ target }) => {
        _this.boundRect[0] = parseInt(target.style.left.replace('px', ''));
        _this.boundRect[1] = parseInt(target.style.top.replace('px', ''));
      })
      .on('resize', ({ target, width, height }) => {
        target.style.width = `${width}px`;
        target.style.height = `${height}px`;
      })
      .on('resizeEnd', ({ target }) => {
        // 自动对齐整数
        const newWidth = parseInt(target.style.width.replace('px', ''));
        const newHeight = parseInt(target.style.height.replace('px', ''));
        target.style.width = `${newWidth}px`;
        target.style.height = `${newHeight}px`;
        _this.scale = newWidth / _this.boundRect[2];
      });
    // 刚渲染完未被点击时不允许拖拽
    setTimeout(() => {
      this.cancelSelect();
    }, 5);
  }
  destroy() {
    this.moveable?.destroy();
    this.instance && this.target?.removeChild(this.instance);
  }
}
