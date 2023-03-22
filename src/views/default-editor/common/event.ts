import { EventBusListener, useEventBus } from '@vueuse/core';

const canvasRevertEvent = Symbol('revert');
const revertBus = useEventBus<Symbol>(canvasRevertEvent);
const onCanvasRevertEvent = (listener: EventBusListener) => revertBus.on(listener);
const emitCanvasRevertEvent = () => revertBus.emit(canvasRevertEvent);

const persistLineEvent = Symbol('persistLine');
const persistLineBus = useEventBus<Symbol>(persistLineEvent);
const onPersistLineEvent = (listener: EventBusListener) => persistLineBus.on(listener);
const emitPersistLineEvent = (beginPoint: PointA, endPoint: PointA) => persistLineBus.emit(persistLineEvent, { beginPoint, endPoint });

export {
    onCanvasRevertEvent,
    emitCanvasRevertEvent,
    onPersistLineEvent,
    emitPersistLineEvent
};
