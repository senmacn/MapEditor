import { getLocalApi } from '@/utils/env';
import { defineStore } from 'pinia';

const userConfig = {
  filename: '',
  userConfig: {
    exportLocation: '',
    downloadLocation: '',
    autoSaveTime: 0,
  },
};

const storage = localStorage.getItem('user-config-filename');
if (storage) {
  userConfig['user-config-filename'] = storage;
}

export const useLocalState = defineStore({
  id: 'local-state',
  state: () => userConfig,
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
  },
  actions: {
    setFileName(filename: string) {
      document.title = filename;
      this.filename = filename;
    },
    setUserConfig(userConfig: UserConfig) {
      const localApi = getLocalApi();
      localApi && localApi.setUserConfig(userConfig);
      this.userConfig = userConfig;
    },
  },
});
