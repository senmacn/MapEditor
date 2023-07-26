import { emitProgressEvent } from './progress-event';
import { ProgressEventPayload, ProgressMessage } from './type';
import ControlledProgress from './controlled-progress.vue';

export default ControlledProgress;

export type { ProgressEventPayload, ProgressMessage };

export function useProgressEvent() {
  function start(count) {
    emitProgressEvent({
      type: 'start',
      count: count,
    });
  }
  function execute(message?: any) {
    emitProgressEvent({
      type: 'progress',
      message: message,
    });
  }

  return [start, execute];
}
