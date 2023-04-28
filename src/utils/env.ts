import { isNullOrUnDef } from './is';

const localApiExists = isNullOrUnDef(window['localApi']);

export function getLocalApi() {
  return localApiExists ? (window['localApi'] as Recordable) : null;
}
