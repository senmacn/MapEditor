import { ref } from 'vue';

export enum CanvasOption {
  FollowMouse,
  FollowMouseClear,
  DrawLine,
  DrawRect,
}

class CanvasOptionController {
  private state = ref(CanvasOption.FollowMouse);
  private active = false;
  constructor() {
    document.body.style.cursor = 'url(./src/assets/ico/cursor.ico), pointer';
  }
  setState(option: CanvasOption) {
    if (option == CanvasOption.FollowMouse) {
      document.body.style.cursor = 'url(./src/assets/ico/cursor.ico), pointer';
    } else if (option === CanvasOption.DrawLine) {
      document.body.style.cursor = 'crosshair';
    } else {
      document.body.style.cursor = 'url(./src/assets/ico/eraser.svg), pointer';
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

const controller = new CanvasOptionController();

export default controller;
