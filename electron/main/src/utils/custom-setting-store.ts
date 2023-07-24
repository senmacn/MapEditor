import ElectronStore from 'electron-store';

interface CustomSetting {
  openProjectInNewWindow: boolean;
  ctrlSSaveProject: boolean;
}

type CustomSettingKey = keyof CustomSetting;

export default class CustomSettingStore {
  store: ElectronStore<CustomSetting>;
  constructor() {
    this.store = new ElectronStore<CustomSetting>({
      name: 'custom-setting',
      defaults: {
        openProjectInNewWindow: false,
        ctrlSSaveProject: false,
      },
    });
  }
  getCustomSettings() {
    return this.store.store;
  }
  setCustomSettings(key: CustomSettingKey, value: any) {
    this.store.set(key, value);
  }
}
