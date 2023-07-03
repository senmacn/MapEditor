import { getLocalApi } from '@/utils/env';
import { defineStore } from 'pinia';

const localConfig = {
  filename: '',
  userConfig: {
    exportLocation: '',
    downloadLocation: '',
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
    getExportLocation(): string {
      return this.userConfig.exportLocation;
    },
    getDownloadLocation(): string {
      return this.userConfig.downloadLocation;
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
      document.title = filename;
      this.filename = filename;
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
