import ElectronStore from 'electron-store';

export default class CustomSettingStore {
  store: ElectronStore<CustomSetting>;
  static instance: CustomSettingStore;
  static getInstance() {
    if (!this.instance) {
      this.instance = new CustomSettingStore();
    }
    return this.instance;
  }
  constructor() {
    this.store = new ElectronStore({
      name: 'custom-setting',
      defaults: {
        openProjectInNewWindow: false,
        ctrlSSaveProject: false,
        closeCPUAcceleration: false,
      },
    });
  }
  getCustomSettings() {
    return this.store.store;
  }
  setCustomSettings(key: string, value: any) {
    this.store.set(key, value);
  }
}
