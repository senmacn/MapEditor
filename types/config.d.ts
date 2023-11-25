interface UserConfig {
  exportLocation: string;
  downloadLocation: string;
  colorExportLocation: string;
  uiExportLocation: string;
  remoteURL: string;
  autoSaveTime: number;
  useLatestConfig: boolean;
  mapObj?: Recordable;
  sizeObj?: Recordable;
  projectSizeConfig?: ProjectSizeConfig;
}

interface CustomSetting {
  openProjectInNewWindow: boolean;
  ctrlSSaveProject: boolean;
  autoOpenDownloadDirectory: boolean;
  closeCPUAcceleration: boolean;
}

type CustomSettingKey = keyof CustomSetting;
