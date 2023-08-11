interface LocalApi {
  getUserConfig(): Promise<UserConfig>;
  setUserConfig(config: UserConfig): Promise<LocalResult<null>>;
  getCustomConfig(): Promise<CustomSetting>;
  setCustomConfig(key: CustomSettingKey, value: any): Promise<LocalResult<null>>;
  getLocalHistoryList(): Promise<Recordable[]>;
  getLocalFileContent(fileName: string): Promise<string>;
  deleteLocalFile(fileName: string): Promise<unknown>;
  renameLocalFile(fileName: string, newname: string): Promise<LocalResult<null>>;
  saveLoads(fileName: string, data: Object): Promise<LocalResult<null>>;
  saveLocalFile(
    fileName: string,
    data: string | Buffer,
    folder?: string,
  ): Promise<LocalResult<null>>;
  newWindow(url: string, browser?: boolean): Promise<LocalResult<null>>;
  relaunch(): void;
  maximizeWindow(): void;
  minimizeWindow(): void;
  closeWindow(): void;
  openFolder(folderName: string): Promise<LocalResult<null>>;
  concatExr(targetDir: string): Promise<LocalResult<string>>;
  createShareLink(filename: string, uuid: string): Promise<LocalResult<string>>;
  executeShareLink(link: string): Promise<LocalResult<Recordable>>;
  starItem(filename: string, star: boolean): Promise<LocalResult<null>>;
  openDevTools(): void;
}
