import { ref } from 'vue';

export enum CanvasOption {
  FollowMouse,
  FollowMouseClear,
  DrawLine,
  DrawRect,
}

function setCursor(cursor: string) {
  const scrollElement = document.getElementsByClassName('scroller')[0] as HTMLElement;
  scrollElement.style.cursor = cursor;
}

class CanvasStateController {
  private state = ref(CanvasOption.FollowMouse);
  private active = false;
  constructor() {
  }
  setState(option: CanvasOption) {
    if (option === CanvasOption.FollowMouse) {
      setCursor('url(./src/assets/ico/cursor.ico), pointer');
    } else if (option === CanvasOption.DrawLine) {
      setCursor('crosshair');
    } else {
      setCursor('url(./src/assets/ico/eraser.svg), pointer');
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
