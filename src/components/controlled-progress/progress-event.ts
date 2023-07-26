import { onUnmounted } from 'vue';
import { EventBusListener, useEventBus } from '@vueuse/core';
import { ProgressEventPayload } from './type';

const progressEvent = Symbol('progress');
const progressBus = useEventBus<Symbol>(progressEvent);
const onProgressEvent = (listener: EventBusListener) => {
  progressBus.on(listener);
  onUnmounted(() => progressBus.off(listener));
};
const emitProgressEvent = (payload: ProgressEventPayload) => progressBus.emit(progressEvent, payload);

export { onProgressEvent, emitProgressEvent };
