import { getLocalApi } from '@/utils/env';
import { defineStore } from 'pinia';

enum Mode {
  Normal,
  History
}

const localConfig = {
  mode: Mode.Normal,
  filename: '',
  historyName: '',
  userConfig: {
    exportLocation: '',
    downloadLocation: '',
    colorExportLocation: '',
    remoteURL: '',
    autoSaveTime: 5,
    useLatestConfig: false,
  },
};

export const useLocalState = defineStore({
  id: 'local-state',
  state: () => localConfig,
  getters: {
    getFileName(): string {
      return this.filename;
    },
    getHistoryName(): string {
      return this.historyName;
    },
    isHistoryMode(): boolean {
      return this.mode === Mode.History;
    },
    getExportLocation(): string {
      return this.userConfig.exportLocation;
    },
    getDownloadLocation(): string {
      return this.userConfig.downloadLocation;
    },
    getColorExportLocation(): string {
      return this.userConfig.colorExportLocation;
    },
    getRemoteURL(): string {
      return this.userConfig.remoteURL;
    },
    getAutoSaveTime(): number {
      return this.userConfig.autoSaveTime;
    },
    getUseLatestConfig(): boolean {
      return this.userConfig.useLatestConfig;
    },
  },
  actions: {
    setFileName(filename: string) {
      document.title = decodeURIComponent(filename);
      this.filename = decodeURIComponent(filename);
    },
    setHistoryName(historyName: string) {
      if (historyName.length > 5) {
        document.title = decodeURIComponent(historyName);
      }
      this.historyName = historyName;
    },
    setHistoryMode() {
      this.mode = Mode.History;
    },
    initUserConfig(userConfig: UserConfig) {
      this.userConfig = userConfig;
    },
    setUserConfig(userConfig: UserConfig) {
      const localApi = getLocalApi();
      localApi && localApi.setUserConfig(userConfig);
      this.userConfig = userConfig;
    },
  },
});
