import { EventBusListener, useEventBus } from '@vueuse/core';

const canvasRevertEvent = Symbol('revert');

const bus = useEventBus<Symbol>(canvasRevertEvent);

const onCanvasRevertEvent = (listener: EventBusListener) => bus.on(listener);

const emitCanvasRevertEvent = () => bus.emit(canvasRevertEvent);

export {
    onCanvasRevertEvent,
    emitCanvasRevertEvent
};
