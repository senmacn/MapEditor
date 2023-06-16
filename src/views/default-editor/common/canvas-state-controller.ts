import { ref } from 'vue';
import { Area } from '../draw-element';

export enum CanvasAreaOption {
  AreaCheck,
  AreaAdd,
  AreaEdit,
}

export enum CanvasOption {
  None,
  FollowMouse,
  FollowMouseClear,
  Pen,
  DrawLine,
  DrawRect,
  DrawCircle,
}

const DrawingShape = [CanvasOption.DrawCircle, CanvasOption.DrawLine, CanvasOption.DrawRect];

function setCursor(cursor: string) {
  // 替换成用class实现
  document.body.style.cursor = cursor;
}

class CanvasStateController {
  private areaState = ref(CanvasAreaOption.AreaCheck);
  private state = ref(CanvasOption.None);
  private currentAreas = ref<Area[]>([]);
  private currentPin = ref<Recordable | null>(null);
  constructor() {}
  getState() {
    return this.state.value;
  }
  setState(option: CanvasOption) {
    if (option === CanvasOption.FollowMouse) {
      setCursor('url("src/assets/cursor/pencil1.svg"), pointer');
    } else if (DrawingShape.includes(option)) {
      setCursor('crosshair');
    } else {
      setCursor('default');
    }
    this.state.value = option;
  }
  isDrawingShape() {
    return DrawingShape.includes(this.state.value);
  }
  isDrawingPen() {
    return this.state.value === CanvasOption.Pen;
  }
  isSelectedArea() {
    return this.currentAreas.value.length;
  }
  getCurrentAreas() {
    return this.currentAreas.value;
  }
  setCurrentAreas(areas: Area[]) {
    this.currentAreas.value = areas;
  }
  addCurrentArea(area: Area) {
    const areas = this.currentAreas.value;
    const index = areas.findIndex((_area) => _area.isSame(area));
    if (index >= 0) return;
    areas.push(area);
  }
  removeCurrentArea(area: Area) {
    const areas = this.currentAreas.value;
    const index = areas.findIndex((_area) => _area.isSame(area));
    this.currentAreas.value = areas.splice(index, 1);
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
