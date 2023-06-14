import electronApi from './electron/electron';
import { isNullOrUnDef } from './is';

export interface LocalApi {
  getUserConfig(): Promise<UserConfig>;
  setUserConfig(config: UserConfig): Promise<LocalResult<null>>;
  getLocalHistoryList(): Promise<Recordable[]>;
  getLocalFileContent(fileName: string): Promise<string>;
  deleteLocalFile(fileName: string): Promise<unknown>;
  renameLocalFile(fileName: string, newname: string): Promise<LocalResult<null>>;
  saveLocalFile(fileName: string, data: string | Buffer, folder?: string): Promise<unknown>;
  newWindow(url: string, browser?: boolean): Promise<LocalResult<null>>;
}

const localApiExists = !isNullOrUnDef(window['electronAPI']);

export function isLocal() {
  return localApiExists;
}

export function getLocalApi() {
  // TODO: {} as LocalApi
  return localApiExists ? electronApi : null;
}
