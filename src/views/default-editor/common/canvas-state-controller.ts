import { Ref, ref } from 'vue';
import { Area, Pin } from '../draw-element';
import { message } from 'ant-design-vue';
import { isArray } from '@/utils/is';
import PencilSvg from '@/assets/cursor/pencil.svg';
import { Layer } from './types';

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

export enum AreaActionType {
  MOVE,
  SCALE,
}

interface AreaAction {
  key: string;
  uuid: string;
  type: AreaActionType;
  state: [number, number] | number;
}

const DrawingShape = [CanvasOption.DrawCircle, CanvasOption.DrawLine, CanvasOption.DrawRect];

function setCursor(cursor: string) {
  // 替换成用class实现
  const scroller = document.getElementById('scroller') as HTMLElement;
  scroller.style.cursor = cursor;
}

class CanvasStateController {
  private areaState = ref(CanvasAreaOption.AreaCheck);
  private state = ref(CanvasOption.None);
  private currentLayer: Ref<Layer | null> = ref(null);
  private currentAreas: Ref<Area[]> = ref([]);
  private currentPin: Ref<Pin | null> = ref(null);
  private actions: AreaAction[] = [];
  constructor() {}
  getState() {
    return this.state.value;
  }
  setState(option: CanvasOption) {
    if (option === CanvasOption.FollowMouse) {
      setCursor(`url(${PencilSvg}), pointer`);
    } else if (option === CanvasOption.Pen) {
      setCursor(`url(${PencilSvg}), pointer`);
    } else if (DrawingShape.includes(option)) {
      setCursor('crosshair');
    } else {
      setCursor('auto');
    }
    this.state.value = option;
  }
  isDrawingShape() {
    return DrawingShape.includes(this.state.value);
  }
  isDrawingPen() {
    return this.state.value === CanvasOption.Pen;
  }
  getCurrentLayer() {
    return this.currentLayer.value;
  }
  setCurrentLayer(layer: Layer | null) {
    if (layer) {
      if (layer.lock) {
        return;
      }
      if (this.currentLayer && this.currentLayer.value === layer) {
        return;
      }
      layer.hot = true;
    }
    if (this.currentLayer.value) {
      this.currentLayer.value.hot = false;
    }
    this.currentLayer.value = layer;
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
  setCurrentPin(pin: Pin | null) {
    this.currentPin.value = pin;
  }
  pushAction(action: AreaAction) {
    this.actions.push(action);
  }
  revertAction(canvasState: any) {
    if (this.actions.length > 0) {
      const toRevertAction: AreaAction[] = [];
      const action = this.actions.pop() as AreaAction;
      toRevertAction.push(action);
      // 查看是否有同key同时处理的action
      while (this.actions.length > 0 && this.actions[this.actions.length - 1].key === action.key) {
        const _action = this.actions.pop() as AreaAction;
        toRevertAction.push(_action);
      }
      // 开始处理
      for (let index = 0; index < toRevertAction.length; index++) {
        const action = toRevertAction[index];
        const area = canvasState.getAreaMap.get(action.uuid);
        if (!area) continue;
        if (action.type === AreaActionType.MOVE) {
          if (isArray(action.state)) {
            const boundRect = area.getBoundRect();
            boundRect[0] = action.state[0];
            boundRect[1] = action.state[1];
            area.setBoundRect(boundRect);
            area.render(area.target as HTMLElement);
          }
        } else {
          if (!isArray(action.state)) {
            area.scale = action.state;
            area.render(area.target as HTMLElement);
          }
        }
      }
      message.info('还原区域');
    }
  }
}

const controller = new CanvasStateController();

export default controller;
