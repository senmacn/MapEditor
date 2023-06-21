import electronApi from './electron/electron';
import { isNullOrUnDef } from './is';

const localApiExists = !isNullOrUnDef(window['electronAPI']);

export function isLocal() {
  return localApiExists;
}

export function getLocalApi() {
  // TODO: {} as LocalApi
  return localApiExists ? electronApi : null;
}
