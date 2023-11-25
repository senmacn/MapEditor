import { BrowserWindow, ipcMain, shell, app } from 'electron';
import * as path from 'path';
import { SAVES_DIR } from '../common/const';
import { createShortcut } from '../utils/exe-runner';

export default function () {
  // 创建多窗口表
  const windMap = new Map<number, BrowserWindow>();
  const baseWindows = BrowserWindow.getAllWindows();
  baseWindows.forEach((win) => windMap.set(win.webContents.id, win));

  ipcMain.handle('new-window', (_evt, url: string, browser: boolean): LocalResult<null> => {
    try {
      if (browser) {
        shell.openExternal(url);
        return null;
      }
      const win = new BrowserWindow({
        frame: true,
        width: 1600,
        height: 1024,
        minWidth: 1600,
        minHeight: 1024,
        icon: path.join(app.getAppPath(), 'src/assets/ico/map32.ico'),
        titleBarStyle: 'hidden',
        webPreferences: {
          webSecurity: false,
          nodeIntegration: true,
          preload: path.join(app.getAppPath(), 'electron/preload/dist/index.cjs'),
        },
      });
      win.on('ready-to-show', () => {
        win.maximize();
        win?.show();
        if (import.meta.env.DEV) {
          win?.webContents.openDevTools();
        }
      });
      win.loadURL(url);

      windMap.set(win.webContents.id, win);

      return null;
    } catch (err) {
      return err as LocalError;
    }
  });

  ipcMain.handle('relaunch', () => {
    app.relaunch();
    app.exit();
  });

  ipcMain.handle('maximize-window', (event) => {
    const window = windMap.get(event.sender.id);
    if (window) {
      window?.isMaximized() ? window.unmaximize() : window?.maximize();
    }
  });

  ipcMain.handle('minimize-window', (event) => {
    const window = windMap.get(event.sender.id);
    if (window) {
      window.minimize();
    }
  });

  ipcMain.handle('close-window', (event) => {
    const window = windMap.get(event.sender.id);
    if (window) {
      window.close();
      windMap.delete(event.sender.id);
    }
  });

  ipcMain.handle('open-dev-tools', (event) => {
    const window = windMap.get(event.sender.id);
    if (window) {
      window.webContents.openDevTools();
    }
  });

  ipcMain.handle('clear-cache', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.webContents.session.clearCache();
    }
  });

  ipcMain.handle('open-folder', (_e, folderName?: string) => {
    shell.openPath(folderName || path.resolve(process.cwd(), SAVES_DIR));
  });

  ipcMain.handle('create-shortcut', () => {
    createShortcut();
  });
}
