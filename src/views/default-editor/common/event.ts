import { onUnmounted } from 'vue';
import { EventBusListener, useEventBus } from '@vueuse/core';

// 还原事件
const canvasRedoEvent = Symbol('redo');
const redoBus = useEventBus<Symbol>(canvasRedoEvent);
const onCanvasRedoEvent = (listener: EventBusListener) => {
  redoBus.on(listener);
  onUnmounted(() => redoBus.off(listener));
};
const emitCanvasRedoEvent = () => redoBus.emit(canvasRedoEvent);

// 撤销事件
const canvasUndoEvent = Symbol('undo');
const undoBus = useEventBus<Symbol>(canvasUndoEvent);
const onCanvasUndoEvent = (listener: EventBusListener) => {
  undoBus.on(listener);
  onUnmounted(() => undoBus.off(listener));
};
const emitCanvasUndoEvent = () => undoBus.emit(canvasUndoEvent);

// 根据mask-canvas创建直线(考虑自动连接，line单独处理)
const persistLineEvent = Symbol('persistLine');
const persistLineBus = useEventBus<Symbol>(persistLineEvent);
const onPersistLineEvent = (listener: EventBusListener) => {
  persistLineBus.on(listener);
  onUnmounted(() => persistLineBus.off(listener));
};
const emitPersistLineEvent = (beginPoint: PointA, endPoint: PointA) =>
  persistLineBus.emit(persistLineEvent, { beginPoint, endPoint });

// 根据mask-canvas创建形状
const persistShapeEvent = Symbol('persistShape');
const persistShapeBus = useEventBus<Symbol>(persistShapeEvent);
const onPersistShapeEvent = (listener: EventBusListener) => {
  persistShapeBus.on(listener);
  onUnmounted(() => persistShapeBus.off(listener));
};
const emitPersistShapeEvent = (payload: any[]) => persistShapeBus.emit(persistShapeEvent, payload);

const editAreaEvent = Symbol('editArea');
const editAreaBus = useEventBus<Symbol>(editAreaEvent);
const onEditAreaEvent = (listener: EventBusListener) => {
  editAreaBus.on(listener);
  onUnmounted(() => editAreaBus.off(listener));
};
const emitEditAreaEvent = () => editAreaBus.emit(editAreaEvent);

// 删除区域
const deleteAreaEvent = Symbol('deleteArea');
const deleteAreaBus = useEventBus<Symbol>(deleteAreaEvent);
const onDeleteAreaEvent = (listener: EventBusListener) => {
  deleteAreaBus.on(listener);
  onUnmounted(() => deleteAreaBus.off(listener));
};
const emitDeleteAreaEvent = () => deleteAreaBus.emit(deleteAreaEvent);

// 快速定位
const focusAreaEvent = Symbol('focusArea');
const focusAreaBus = useEventBus<Symbol>(focusAreaEvent);
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
  onDeleteAreaEvent,
  emitDeleteAreaEvent,
  onFocusAreaEvent,
  emitFocusAreaEvent,
};
