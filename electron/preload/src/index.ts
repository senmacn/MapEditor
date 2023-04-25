import type { IpcRendererEvent} from 'electron';
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {

});
