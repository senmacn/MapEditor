import { ipcMain } from 'electron';
import { writeFileSync } from 'fs';
import CustomSettingStore from './store/custom-setting-store';
import { CONFIG_PATH } from './common/const';
import UserConfigStore from './store/user-config-store';
// 引入额外的handler
import electronHandler from './handler/electron-handler';
import expandHandler from './handler/expand-handler';
import fileHandler from './handler/file-handler';

export default function setupEvent() {
  // 用户设置
  const userConfig = UserConfigStore.getInstance().config;
  // 自定义设置
  const customSettingStore = CustomSettingStore.getInstance();

  // --- 下面开始设置事件 ---
  ipcMain.handle('set-user-config', (_evt, config: UserConfig) => {
    Object.assign(userConfig, config);
    return writeFileSync(CONFIG_PATH, JSON.stringify(userConfig), {
      encoding: 'utf8',
    });
  });

  ipcMain.handle('get-user-config', (): UserConfig => {
    return userConfig;
  });

  ipcMain.handle('get-custom-config', (): CustomSetting => {
    return customSettingStore.getCustomSettings();
  });

  ipcMain.handle('set-custom-config', (_evt, key: CustomSettingKey, value: any) => {
    customSettingStore.setCustomSettings(key, value);
  });

  electronHandler();
  expandHandler();
  fileHandler();
}
