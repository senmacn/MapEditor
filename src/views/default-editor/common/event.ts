import type { EventBusListener } from '@vueuse/core';
import { onUnmounted } from 'vue';
import { useEventBus } from '@vueuse/core';

// 重做事件
const canvasRedoEvent = Symbol('redo');
const redoBus = useEventBus<symbol>(canvasRedoEvent);
const onCanvasRedoEvent = (listener: EventBusListener) => {
  redoBus.on(listener);
  onUnmounted(() => redoBus.off(listener));
};
const emitCanvasRedoEvent = () => redoBus.emit(canvasRedoEvent);

// 撤销事件
const canvasUndoEvent = Symbol('undo');
const undoBus = useEventBus<symbol>(canvasUndoEvent);
const onCanvasUndoEvent = (listener: EventBusListener) => {
  undoBus.on(listener);
  onUnmounted(() => undoBus.off(listener));
};
const emitCanvasUndoEvent = () => undoBus.emit(canvasUndoEvent);

// 根据mask-canvas创建直线(考虑自动连接，line单独处理)
const persistLineEvent = Symbol('persistLine');
const persistLineBus = useEventBus<symbol>(persistLineEvent);
const onPersistLineEvent = (listener: EventBusListener) => {
  persistLineBus.on(listener);
  onUnmounted(() => persistLineBus.off(listener));
};
const emitPersistLineEvent = (beginPoint: PointA, endPoint: PointA) =>
  persistLineBus.emit(persistLineEvent, { beginPoint, endPoint });

// 根据mask-canvas创建形状
const persistShapeEvent = Symbol('persistShape');
const persistShapeBus = useEventBus<symbol>(persistShapeEvent);
const onPersistShapeEvent = (listener: EventBusListener) => {
  persistShapeBus.on(listener);
  onUnmounted(() => persistShapeBus.off(listener));
};
const emitPersistShapeEvent = (payload: any[]) => persistShapeBus.emit(persistShapeEvent, payload);

const editAreaEvent = Symbol('editArea');
const editAreaBus = useEventBus<symbol>(editAreaEvent);
const onEditAreaEvent = (listener: EventBusListener) => {
  editAreaBus.on(listener);
  onUnmounted(() => editAreaBus.off(listener));
};
const emitEditAreaEvent = () => editAreaBus.emit(editAreaEvent);

const editPathwayEvent = Symbol('editPathway');
const editPathwayBus = useEventBus<symbol>(editPathwayEvent);
const onEditPathwayEvent = (listener: EventBusListener) => {
  editPathwayBus.on(listener);
  onUnmounted(() => editPathwayBus.off(listener));
};
const emitEditPathwayEvent = () => editPathwayBus.emit(editPathwayEvent);

// 基于已有创建
const editWithAreaEvent = Symbol('editWithArea');
const editWithAreaBus = useEventBus<symbol>(editWithAreaEvent);
const onEditWithAreaEvent = (listener: EventBusListener) => {
  editWithAreaBus.on(listener);
  onUnmounted(() => editWithAreaBus.off(listener));
};
const emitEditWithAreaEvent = () => editWithAreaBus.emit(editWithAreaEvent);

// 删除区域
const deleteAreaEvent = Symbol('deleteArea');
const deleteAreaBus = useEventBus<symbol>(deleteAreaEvent);
const onDeleteAreaEvent = (listener: EventBusListener) => {
  deleteAreaBus.on(listener);
  onUnmounted(() => deleteAreaBus.off(listener));
};
const emitDeleteAreaEvent = () => deleteAreaBus.emit(deleteAreaEvent);

// 删除路径
const deletePathwayEvent = Symbol('deletePathway');
const deletePathwayBus = useEventBus<symbol>(deletePathwayEvent);
const onDeletePathwayEvent = (listener: EventBusListener) => {
  deletePathwayBus.on(listener);
  onUnmounted(() => deletePathwayBus.off(listener));
};
const emitDeletePathwayEvent = () => deletePathwayBus.emit(deletePathwayEvent);

// 快速定位
const focusAreaEvent = Symbol('focusArea');
const focusAreaBus = useEventBus<symbol>(focusAreaEvent);
const onFocusAreaEvent = (listener: EventBusListener) => {
  focusAreaBus.on(listener);
  onUnmounted(() => focusAreaBus.off(listener));
};
const emitFocusAreaEvent = (payload) => focusAreaBus.emit(focusAreaEvent, payload);

export {
  onCanvasRedoEvent,
  emitCanvasRedoEvent,
  onCanvasUndoEvent,
  emitCanvasUndoEvent,
  onPersistLineEvent,
  emitPersistLineEvent,
  onPersistShapeEvent,
  emitPersistShapeEvent,
  onEditAreaEvent,
  emitEditAreaEvent,
  onEditWithAreaEvent,
  emitEditWithAreaEvent,
  onDeleteAreaEvent,
  emitDeleteAreaEvent,
  onFocusAreaEvent,
  emitFocusAreaEvent,
  onEditPathwayEvent,
  emitEditPathwayEvent,
  onDeletePathwayEvent,
  emitDeletePathwayEvent,
};
