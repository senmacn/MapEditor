import { EventBusListener, useEventBus } from '@vueuse/core';

const canvasRevertEvent = Symbol('revert');
const revertBus = useEventBus<Symbol>(canvasRevertEvent);
const onCanvasRevertEvent = (listener: EventBusListener) => revertBus.on(listener);
const emitCanvasRevertEvent = () => revertBus.emit(canvasRevertEvent);

const canvasRevokeEvent = Symbol('revoke');
const revokeBus = useEventBus<Symbol>(canvasRevokeEvent);
const onCanvasRevokeEvent = (listener: EventBusListener) => revokeBus.on(listener);
const emitCanvasRevokeEvent = () => revokeBus.emit(canvasRevokeEvent);

const persistLineEvent = Symbol('persistLine');
const persistLineBus = useEventBus<Symbol>(persistLineEvent);
const onPersistLineEvent = (listener: EventBusListener) => persistLineBus.on(listener);
const emitPersistLineEvent = (beginPoint: PointA, endPoint: PointA) => persistLineBus.emit(persistLineEvent, { beginPoint, endPoint });

export {
    onCanvasRevertEvent,
    emitCanvasRevertEvent,
    onCanvasRevokeEvent,
    emitCanvasRevokeEvent,
    onPersistLineEvent,
    emitPersistLineEvent
};
