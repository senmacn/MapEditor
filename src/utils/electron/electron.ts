class ElectronApi implements LocalApi {
  getUserConfig(): Promise<UserConfig> {
    return window['electronAPI'].getUserConfig();
  }
  setUserConfig(config: UserConfig): Promise<LocalResult<null>> {
    return window['electronAPI'].setUserConfig(config);
  }
  getLocalHistoryList(): Promise<Recordable<any>[]> {
    return window['electronAPI'].getLocalHistoryList();
  }
  getLocalFileContent(fileName: string): Promise<string> {
    return window['electronAPI'].getLocalFileContent(fileName);
  }
  renameLocalFile(fileName: string, newname: string): Promise<LocalResult<null>> {
    return window['electronAPI'].renameLocalFile(fileName, newname);
  }
  deleteLocalFile(fileName: string): Promise<unknown> {
    return window['electronAPI'].deleteLocalFile(fileName);
  }
  saveLocalFile(
    fileName: string,
    data: string | Buffer,
    folder?: string,
  ): Promise<LocalResult<null>> {
    return window['electronAPI'].saveLocalFile(fileName, data, folder);
  }
  newWindow(url: string, browser = false): Promise<LocalResult<null>> {
    return window['electronAPI'].newWindow(url, browser);
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
  openFolder(folderName: string): Promise<LocalResult<null>> {
    return window['electronAPI'].openFolder(folderName);
  }
  concatExr(folderName: string): Promise<LocalResult<string>> {
    return window['electronAPI'].concatExr(folderName);
  }
}

const electronApi = new ElectronApi();

export default electronApi;
