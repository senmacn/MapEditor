import { contextBridge, ipcRenderer } from 'electron';

const electronApi: LocalApi = {
  getUserConfig: async (): Promise<UserConfig> => {
    return await ipcRenderer.invoke('get-user-config');
  },
  setUserConfig: async (config: UserConfig) => {
    return await ipcRenderer.invoke('set-user-config', config);
  },
  getCustomConfig: async () => {
    return await ipcRenderer.invoke('get-custom-config');
  },
  setCustomConfig: async (key, value) => {
    return await ipcRenderer.invoke('set-custom-config', key, value);
  },
  getLocalFileList: async () => {
    return await ipcRenderer.invoke('get-local-file-list');
  },
  getLocalHistoryList: async (fileName) => {
    return await ipcRenderer.invoke('get-local-history-list', fileName);
  },
  getLocalFileContent: async (fileName: string, history?: string) => {
    return await ipcRenderer.invoke('get-local-file-content', fileName, history);
  },
  useLocalFileHistory: async (historyName: string) => {
    return await ipcRenderer.invoke('use-local-file-history', historyName);
  },
  renameLocalFile: async (fileName: string, newname: string): Promise<LocalResult<null>> => {
    return await ipcRenderer.invoke('rename-local-file', fileName, newname);
  },
  deleteLocalFile: async (fileName: string) => {
    return await ipcRenderer.invoke('delete-local-file', fileName);
  },
  saveLoads: async (fileName: string, data: object) => {
    return await ipcRenderer.invoke('save-loads', fileName, data);
  },
  saveLocalFile: async (fileName: string, data: string | Buffer, folder?: string) => {
    return await ipcRenderer.invoke('save-local-file', fileName, data, folder);
  },
  newWindow: async (url: string, browser?: boolean) => {
    return await ipcRenderer.invoke('new-window', url, browser);
  },
  relaunch: () => {
    return ipcRenderer.invoke('relaunch');
  },
  maximizeWindow: () => {
    ipcRenderer.invoke('maximize-window');
  },
  minimizeWindow: () => {
    ipcRenderer.invoke('minimize-window');
  },
  closeWindow: () => {
    ipcRenderer.invoke('close-window');
  },
  openFolder: async () => {
    return await ipcRenderer.invoke('open-folder');
  },
  concatExr: async (targetDir: string) => {
    return await ipcRenderer.invoke('concat-exr', targetDir);
  },
  createShareLink: async (filename: string, uuid: string) => {
    return await ipcRenderer.invoke('create-share-link', filename, uuid);
  },
  executeShareLink: async (link: string) => {
    return await ipcRenderer.invoke('execute-share-link', link);
  },
  starItem: async (filename: string, star: boolean) => {
    return await ipcRenderer.invoke('star-item', filename, star);
  },
  openDevTools: () => {
    return ipcRenderer.invoke('open-dev-tools');
  },
  clearCache: () => {
    return ipcRenderer.invoke('clear-cache');
  },
  stringifyData: (obj: object) => {
    return ipcRenderer.invoke('stringify-data', obj);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronApi);
