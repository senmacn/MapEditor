import type { BrowserWindow } from 'electron';
import { ipcMain } from 'electron';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  statSync,
  readFileSync,
  rmSync,
} from 'fs';
import * as path from 'path';

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

  ipcMain.handle('delete-local-file', (_evt, fileName: string) => {
    try {
      rmSync(path.join(SAVES_DIR, fileName));
      return;
    } catch (err) {
      console.log(err);

      return err as Error;
    }
  });

  ipcMain.handle('save-local-file', (_evt, fileName: string, data: string): undefined | Error => {
    try {
      writeFileSync(path.join(SAVES_DIR, fileName), data, {
        encoding: 'utf8',
      });
      return;
    } catch (err) {
      console.log(err);

      return err as Error;
    }
  });
}
