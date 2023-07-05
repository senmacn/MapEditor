interface LocalApi {
  getUserConfig(): Promise<UserConfig>;
  setUserConfig(config: UserConfig): Promise<LocalResult<null>>;
  getLocalHistoryList(): Promise<Recordable[]>;
  getLocalFileContent(fileName: string): Promise<string>;
  deleteLocalFile(fileName: string): Promise<unknown>;
  renameLocalFile(fileName: string, newname: string): Promise<LocalResult<null>>;
  saveLocalFile(fileName: string, data: string | Buffer, folder?: string): Promise<unknown>;
  newWindow(url: string, browser?: boolean): Promise<LocalResult<null>>;
  maximizeWindow(): void;
  minimizeWindow(): void;
  closeWindow(): void;
  openFolder(folderName: string): Promise<LocalResult<null>>
  concatExr(targetDir: string): Promise<LocalResult<string>> 
}
