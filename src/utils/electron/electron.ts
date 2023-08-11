class ElectronApi implements LocalApi {
  getUserConfig() {
    return window['electronAPI'].getUserConfig();
  }
  setUserConfig(config: UserConfig) {
    return window['electronAPI'].setUserConfig(config);
  }
  getCustomConfig() {
    return window['electronAPI'].getCustomConfig();
  }
  setCustomConfig(key: CustomSettingKey, value: any) {
    return window['electronAPI'].setCustomConfig(key, value);
  }
  getLocalHistoryList() {
    return window['electronAPI'].getLocalHistoryList();
  }
  getLocalFileContent(fileName: string) {
    return window['electronAPI'].getLocalFileContent(fileName);
  }
  renameLocalFile(fileName: string, newname: string) {
    return window['electronAPI'].renameLocalFile(fileName, newname);
  }
  deleteLocalFile(fileName: string): Promise<unknown> {
    return window['electronAPI'].deleteLocalFile(fileName);
  }
  saveLoads(fileName: string, data: Object) {
    return window['electronAPI'].saveLoads(fileName, data);
  }
  saveLocalFile(fileName: string, data: string | Buffer, folder?: string) {
    return window['electronAPI'].saveLocalFile(fileName, data, folder);
  }
  newWindow(url: string, browser = false) {
    return window['electronAPI'].newWindow(url, browser);
  }
  relaunch() {
    return window['electronAPI'].relaunch();
  }
  maximizeWindow() {
    return window['electronAPI'].maximizeWindow();
  }
  minimizeWindow() {
    return window['electronAPI'].minimizeWindow();
  }
  closeWindow() {
    return window['electronAPI'].closeWindow();
  }
  openFolder(folderName: string) {
    return window['electronAPI'].openFolder(folderName);
  }
  concatExr(folderName: string) {
    return window['electronAPI'].concatExr(folderName);
  }
  createShareLink(filename: string, uuid: string) {
    return window['electronAPI'].createShareLink(filename, uuid);
  }
  executeShareLink(link: string) {
    return window['electronAPI'].executeShareLink(link);
  }
  starItem(id: string, star: boolean) {
    return window['electronAPI'].starItem(id, star);
  }
  openDevTools() {
    return window['electronAPI'].openDevTools();
  }
}

const electronApi = new ElectronApi();

export default electronApi;
