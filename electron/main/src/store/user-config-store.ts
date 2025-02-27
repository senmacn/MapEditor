import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { CONFIG_PATH, DATA_DIR, HISTORY_DIR, SAVES_DIR } from '../common/const';

export default class UserConfigStore {
  config = {
    exportLocation: '',
    downloadLocation: '',
    colorExportLocation: '',
    uiExportLocation: '',
    remoteURL: 'http://10.7.1.194:7792',
    autoSaveTime: 5,
    useLatestConfig: false,
  } as UserConfig;
  constructor() {
    // 初始化配置
    try {
      if (!existsSync(CONFIG_PATH)) {
        mkdirSync(DATA_DIR);
        mkdirSync(SAVES_DIR);
        mkdirSync(HISTORY_DIR);
        writeFileSync(CONFIG_PATH, JSON.stringify(this.config));
      } else {
        if (!existsSync(HISTORY_DIR)) {
          mkdirSync(HISTORY_DIR);
        }
        const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
        Object.assign(this.config, config);
      }
    } catch (e) {
      console.warn(e);
    }
  }
  static instance: UserConfigStore;
  static getInstance(): UserConfigStore {
    if (this.instance) return this.instance;
    this.instance = new UserConfigStore();
    return this.instance;
  }
}
