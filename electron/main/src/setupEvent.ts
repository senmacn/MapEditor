import { BrowserWindow, app } from 'electron';
import { ipcMain } from 'electron';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  statSync,
  readFileSync,
  rmSync,
  renameSync,
} from 'fs';
import * as path from 'path';
import { join } from 'path';
import { attachTitlebarToWindow } from 'custom-electron-titlebar/main';

const DATA_DIR = 'data';
const SAVES_DIR = 'data/saves';

export default function setupEvent(mainWindow: BrowserWindow) {
  // 初始化
  try {
    if (!existsSync('data/config.json')) {
      mkdirSync(DATA_DIR);
      mkdirSync(SAVES_DIR);
      writeFileSync('data/config.json', JSON.stringify({}));
    }
  } catch (e) {}

  // 设置事件
  ipcMain.handle('get-local-history-list', () => {
    return Promise.all(
      readdirSync(SAVES_DIR)
        .filter((fileName) => fileName.endsWith('.json'))
        .map((fileName) => {
          const filePath = path.join(SAVES_DIR, fileName);
          return new Promise((resolve) => {
            const info = statSync(filePath);
            resolve({
              title: fileName,
              description: info.ctime.toLocaleDateString(),
            });
          });
        }),
    );
  });

  ipcMain.handle('get-local-file-content', (_evt, fileName: string) => {
    return readFileSync(path.join(SAVES_DIR, fileName), 'utf8');
  });

  ipcMain.handle(
    'rename-local-file',
    (_evt, fileName: string, newname: string): LocalResult<null> => {
      try {
        renameSync(path.join(SAVES_DIR, fileName), path.join(SAVES_DIR, newname));
        return null;
      } catch (err: any) {
        err.showMessage = '重命名失败！';
        return err as LocalError;
      }
    },
  );

  ipcMain.handle('delete-local-file', (_evt, fileName: string) => {
    try {
      rmSync(path.join(SAVES_DIR, fileName));
      return;
    } catch (err) {
      return err as LocalError;
    }
  });

  ipcMain.handle(
    'save-local-file',
    (
      _evt,
      fileName: string,
      data: string | Buffer,
      folder: string = SAVES_DIR,
    ): undefined | Error => {
      try {
        if (typeof data === 'string') {
          writeFileSync(path.join(folder || SAVES_DIR, fileName), data, {
            encoding: 'utf8',
          });
        } else {
          writeFileSync(path.join(folder || SAVES_DIR, fileName), new Uint8Array(data));
        }

        return;
      } catch (err) {
        (err as LocalError).showMessage =
          'Error saving local file because of error: ' + (err as LocalError).message;
        return err as LocalError;
      }
    },
  );

  ipcMain.handle('new-window', (_evt, url: string): LocalResult<null> => {
    try {
      const win = new BrowserWindow({
        frame: true,
        width: 1600,
        height: 1024,
        minWidth: 1600,
        minHeight: 1024,
        icon: join(app.getAppPath(), 'src/assets/ico/map32.ico'),
        titleBarStyle: 'hidden',
        webPreferences: {
          webSecurity: false,
          nodeIntegration: true,
          preload: join(app.getAppPath(), 'electron/preload/dist/index.cjs'),
        },
      });
      attachTitlebarToWindow(win);
      win.on('ready-to-show', () => {
        win?.show();
        if (import.meta.env.DEV) {
          win?.webContents.openDevTools();
        }
      });

      win.loadURL(url);
      return null;
    } catch (err) {
      return err as LocalError;
    }
  });
}
