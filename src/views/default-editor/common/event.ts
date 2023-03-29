import { EventBusListener, useEventBus } from '@vueuse/core';

// 还原事件
const canvasRedoEvent = Symbol('redo');
const redoBus = useEventBus<Symbol>(canvasRedoEvent);
const onCanvasRedoEvent = (listener: EventBusListener) => redoBus.on(listener);
const emitCanvasRedoEvent = () => redoBus.emit(canvasRedoEvent);

// 撤销事件
const canvasUndoEvent = Symbol('undo');
const undoBus = useEventBus<Symbol>(canvasUndoEvent);
const onCanvasUndoEvent = (listener: EventBusListener) => undoBus.on(listener);
const emitCanvasUndoEvent = () => undoBus.emit(canvasUndoEvent);

// 根据mask-canvas创建直线
const persistLineEvent = Symbol('persistLine');
const persistLineBus = useEventBus<Symbol>(persistLineEvent);
const onPersistLineEvent = (listener: EventBusListener) => persistLineBus.on(listener);
const emitPersistLineEvent = (beginPoint: PointA, endPoint: PointA) =>
  persistLineBus.emit(persistLineEvent, { beginPoint, endPoint });

export {
  onCanvasRedoEvent,
  emitCanvasRedoEvent,
  onCanvasUndoEvent,
  emitCanvasUndoEvent,
  onPersistLineEvent,
  emitPersistLineEvent,
};
