import electronApi from './electron/electron';
import { isNullOrUnDef } from './is';

export interface LocalApi {
  getLocalHistoryList(): Promise<Recordable[]>;
  getLocalFileContent(fileName: string): Promise<string>;
  deleteLocalFile(fileName: string): Promise<unknown>;
  renameLocalFile(fileName: string, newname: string): Promise<LocalResult<null>>;
  saveLocalFile(fileName: string, data: string): Promise<unknown>;
  newWindow(url: string): Promise<LocalResult<null>>;
}

const localApiExists = !isNullOrUnDef(window['electronAPI']);

export function isLocal() {
  return localApiExists;
}

export function getLocalApi() {
  // TODO: {} as LocalApi
  return localApiExists ? electronApi : null;
}
