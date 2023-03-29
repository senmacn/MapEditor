import { ref } from 'vue';
import cursor from '@/assets/ico/cursor.ico';

export enum CanvasOption {
  FollowMouse,
  FollowMouseClear,
  DrawLine,
  DrawRect,
}

function setCursor(cursor: string) {
  // 替换成用class实现
  const scrollElement = document.getElementsByClassName('scroller')[0] as HTMLElement;
  scrollElement.style.cursor = cursor;
}

class CanvasStateController {
  private state = ref(CanvasOption.FollowMouse);
  private active = false;
  constructor() {}
  setState(option: CanvasOption) {
    if (option === CanvasOption.FollowMouse) {
      setCursor(`url(${cursor}, pointer`);
    } else if (option === CanvasOption.DrawLine) {
      setCursor('crosshair');
    } else {
      setCursor('pointer');
    }
    this.state.value = option;
  }
  getState() {
    return this.state.value;
  }
  getActive() {
    return this.active;
  }
  setActive(active: boolean) {
    this.active = active;
  }
  reset() {
    this.setState(CanvasOption.FollowMouse);
  }
}

const controller = new CanvasStateController();

export default controller;
