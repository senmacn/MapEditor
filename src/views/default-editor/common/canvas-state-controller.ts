import { ref } from 'vue';
import cursor from '@/assets/ico/cursor.ico';
import { Area } from './area';
import { isNull } from '@/utils/is';

export enum CanvasAreaOption {
  AreaCheck,
  AreaAdd,
  AreaEdit,
}

export enum CanvasOption {
  None,
  FollowMouse,
  FollowMouseClear,
  DrawLine,
  DrawRect,
  DrawCircle,
}

const DrawingShape = [CanvasOption.DrawCircle, CanvasOption.DrawLine, CanvasOption.DrawRect];

function setCursor(cursor: string) {
  // 替换成用class实现
  const scrollElement = document.getElementsByClassName('scroller')[0] as HTMLElement;
  scrollElement.style.cursor = cursor;
}

class CanvasStateController {
  private areaState = ref(CanvasAreaOption.AreaCheck);
  private state = ref(CanvasOption.None);
  private active = false;
  private currentArea = ref<Area | null>(null);
  private currentPin = ref<Recordable | null>(null);
  constructor() {}
  getState() {
    return this.state.value;
  }
  setState(option: CanvasOption) {
    if (option === CanvasOption.FollowMouse) {
      setCursor(`url(${cursor}, pointer`);
    } else if (DrawingShape.includes(option)) {
      setCursor('crosshair');
    } else {
      setCursor('default');
    }
    this.state.value = option;
  }
  getActive() {
    return this.active;
  }
  setActive(active: boolean) {
    this.active = active;
  }
  isDrawingShape() {
    return DrawingShape.includes(this.state.value);
  }
  getCurrentArea() {
    return this.currentArea.value;
  }
  setCurrentArea(area: Area | null) {
    this.currentArea.value = area;
  }
  startDrawingArea(isAdd: boolean) {
    this.areaState.value = isAdd ? CanvasAreaOption.AreaAdd : CanvasAreaOption.AreaEdit;
    this.setState(CanvasOption.FollowMouse);
  }
  endDrawingArea() {
    this.areaState.value = CanvasAreaOption.AreaCheck;
    this.setState(CanvasOption.None);
  }
  isDrawingArea() {
    return (
      this.areaState.value === CanvasAreaOption.AreaEdit ||
      this.areaState.value === CanvasAreaOption.AreaAdd
    );
  }
  isEditingArea() {
    return this.areaState.value === CanvasAreaOption.AreaEdit;
  }
  reset() {
    this.setState(CanvasOption.FollowMouse);
  }
  getCurrentPin() {
    return this.currentPin.value;
  }
  setCurrentPin(pin: Recordable | null) {
    this.currentPin.value = pin;
  }
}

const controller = new CanvasStateController();

export default controller;
