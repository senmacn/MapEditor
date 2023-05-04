import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getLocalHistoryList: async () => {
    return await ipcRenderer.invoke('get-local-history-list');
  },
  getLocalFileContent: async (fileName: string) => {
    return await ipcRenderer.invoke('get-local-file-content', fileName);
  },
  renameLocalFile: async (fileName: string, newname: string): Promise<LocalResult<null>> => {
    return await ipcRenderer.invoke('rename-local-file', fileName, newname);
  },
  deleteLocalFile: async (fileName: string) => {
    return await ipcRenderer.invoke('delete-local-file', fileName);
  },
  saveLocalFile: async (fileName: string, data: string) => {
    return await ipcRenderer.invoke('save-local-file', fileName, data);
  },
});
