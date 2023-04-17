import { EventBusListener, useEventBus } from '@vueuse/core';
import Area from './area';

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

// 根据mask-canvas创建直线(考虑自动连接，line单独处理)
const persistLineEvent = Symbol('persistLine');
const persistLineBus = useEventBus<Symbol>(persistLineEvent);
const onPersistLineEvent = (listener: EventBusListener) => persistLineBus.on(listener);
const emitPersistLineEvent = (beginPoint: PointA, endPoint: PointA) =>
  persistLineBus.emit(persistLineEvent, { beginPoint, endPoint });

// 根据mask-canvas创建形状
const persistShapeEvent = Symbol('persistShape');
const persistShapeBus = useEventBus<Symbol>(persistShapeEvent);
const onPersistShapeEvent = (listener: EventBusListener) => persistShapeBus.on(listener);
const emitPersistShapeEvent = (payload: any[]) => persistShapeBus.emit(persistShapeEvent, payload);

// 点选区域框
const clickAreaEvent = Symbol('clickArea');
const clickAreaBus = useEventBus<Symbol>(clickAreaEvent);
const onClickAreaEvent = (listener: EventBusListener) => clickAreaBus.on(listener);
const emitClickAreaEvent = (payload: Area | null) => clickAreaBus.emit(clickAreaEvent, payload);

const editAreaEvent = Symbol('editArea');
const editAreaBus = useEventBus<Symbol>(editAreaEvent);
const onEditAreaEvent = (listener: EventBusListener) => editAreaBus.on(listener);
const emitEditAreaEvent = () => editAreaBus.emit(editAreaEvent);

// 删除区域
const deleteAreaEvent = Symbol('deleteArea');
const deleteAreaBus = useEventBus<Symbol>(deleteAreaEvent);
const onDeleteAreaEvent = (listener: EventBusListener) => deleteAreaBus.on(listener);
const emitDeleteAreaEvent = () => deleteAreaBus.emit(deleteAreaEvent);

// 聚焦区域
const focusAreaEvent = Symbol('focusArea');
const focusAreaBus = useEventBus<Symbol>(focusAreaEvent);
const onFocusAreaEvent = (listener: EventBusListener) => focusAreaBus.on(listener);
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
  onClickAreaEvent,
  emitClickAreaEvent,
  onEditAreaEvent,
  emitEditAreaEvent,
  onDeleteAreaEvent,
  emitDeleteAreaEvent,
  onFocusAreaEvent,
  emitFocusAreaEvent,
};
