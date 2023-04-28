import { isNullOrUnDef } from './is';

interface LocalApi {
  getLocalHistoryList(): Recordable[];
  getLocalFileContent(fileName: string): string;
  deleteLocalFile(fileName: string): void;
  saveLocalFile(fileName: string): void;
}

const localApiExists = !isNullOrUnDef(window['localApi']);

export function isLocal() {
  return localApiExists;
}

export function getLocalApi() {
  return localApiExists ? (window['localApi'] as LocalApi) : null;
}
