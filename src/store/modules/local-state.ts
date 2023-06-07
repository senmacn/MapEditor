import { defineStore } from 'pinia';

const userConfig = {
  filename: '',
  exportLocation: '',
  downloadLocation: '',
};
Object.keys(userConfig).forEach((key) => {
  const storage = localStorage.getItem('user-config-' + key);
  if (storage) {
    userConfig[key] = storage;
  }
});

export const useLocalState = defineStore({
  id: 'local-state',
  state: () => userConfig,
  getters: {
    getFileName(): string {
      return this.filename;
    },
    getExportLocation(): string {
      return this.exportLocation;
    },
    getDownloadLocation(): string {
      return this.downloadLocation;
    },
  },
  actions: {
    setFileName(filename: string) {
      document.title = filename;
      this.filename = filename;
    },
    setExportLocation(location: string) {
      localStorage.setItem('user-config-exportLocation', location);
      this.exportLocation = location;
    },
    setDownloadLocation(location: string) {
      localStorage.setItem('user-config-downloadLocation', location);
      this.downloadLocation = location;
    },
  },
});
