import { ipcMain } from 'electron';
import {
  readdirSync,
  statSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
  rm,
  existsSync,
  createReadStream,
} from 'fs';
import path from 'path';
import { FILE_PATH, HISTORY_DIR, SAVES_DIR } from '../common/const';
import { ProjectItemStore } from '../store/project-item-store';
import { stringifySave } from '../utils/json';
import crypto from 'crypto';
import moment from 'moment';

const SPLIT_SYMBOL = '_';

const fileCache = new Map<string, string>();

function saveFile(fileName: string, data: string | Buffer, folder: string) {
  if (typeof data === 'string') {
    writeFileSync(path.join(folder, fileName), data, {
      encoding: 'utf8',
    });
  } else {
    writeFileSync(path.join(folder, fileName), new Uint8Array(data));
  }
  return;
}

function calculateFileHash(filePath: string, algorithm = 'sha256') {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    const fileStream = createReadStream(filePath);
    fileStream.on('data', (chunk: any) => {
      hash.update(chunk);
    });
    fileStream.on('end', () => {
      resolve(hash.digest('hex'));
    });
    fileStream.on('error', (error: any) => {
      reject(error);
    });
  });
}

export default function () {
  // 初始化本地文件额外属性管理工具
  const projectItemStore = new ProjectItemStore(FILE_PATH, SAVES_DIR);
  projectItemStore.init();

  ipcMain.handle('get-local-file-list', () => {
    return readdirSync(SAVES_DIR)
      .filter((fileName) => !fileName.endsWith('.boundary.json') && fileName.endsWith('.json'))
      .map((fileName) => {
        const filePath = path.join(SAVES_DIR, fileName);
        const stat = statSync(filePath);
        // 查找附带额外属性
        const property: Recordable = {};
        projectItemStore.files.forEach((file) => {
          if (file.name === fileName) {
            Object.assign(property, file.property);
          }
        });
        return { fileName: fileName, mtime: stat.mtime, property };
      })
      .sort((a, b) => {
        if (!a.property.star && b.property.star) {
          return 1;
        }
        if (a.property.star && !b.property.star) {
          return -1;
        }
        return a.mtime < b.mtime ? 1 : -1;
      })
      .map((data) => ({
        title: data.fileName,
        description: data.mtime.toLocaleString(),
        property: data.property,
      }));
  });

  ipcMain.handle('get-local-history-list', (_evt, fileName: string) => {
    let result;
    projectItemStore.files.forEach((file) => {
      if (file.name === fileName && file.history) {
        result = file.history || [];
      }
    });
    return result;
  });

  ipcMain.handle('get-local-file-content', (_evt, fileName: string, history?: string) => {
    try {
      if (history && history.length > 5) {
        return readFileSync(path.join(HISTORY_DIR, decodeURIComponent(history)), 'utf8');
      } else {
        return readFileSync(path.join(SAVES_DIR, decodeURIComponent(fileName)), 'utf8');
      }
    } catch (err) {
      (err as LocalError).showMessage = 'Error use local history because of error: ' + (err as LocalError).message;
      return err as LocalError;
    }
  });

  ipcMain.handle('use-local-file-history', (_evt, historyName: string) => {
    try {
      for (let index = 0; index < projectItemStore.files.length; index++) {
        const element = projectItemStore.files[index];
        if (element.history) {
          for (let index = 0; index < element.history.length; index++) {
            const history = element.history[index];
            if (history === historyName) {
              const result = readFileSync(path.join(HISTORY_DIR, decodeURIComponent(historyName)), 'utf8');
              _save(element.name, result);
              break;
            }
          }
        }
      }
    } catch (err) {
      (err as LocalError).showMessage = 'Error use local history because of error: ' + (err as LocalError).message;
      return err as LocalError;
    }
  });

  ipcMain.handle('rename-local-file', (_evt, fileName: string, newname: string): LocalResult<null> => {
    try {
      renameSync(path.join(SAVES_DIR, fileName), path.join(SAVES_DIR, newname));
      projectItemStore.setFileName(newname, fileName);
      return null;
    } catch (err: any) {
      err.showMessage = '重命名失败！';
      return err as LocalError;
    }
  });

  ipcMain.handle('delete-local-file', (_evt, fileName: string) => {
    try {
      rmSync(path.join(SAVES_DIR, fileName));
      // 同时删除历史记录
      projectItemStore.files.forEach((file) => {
        if (file.name === fileName) {
          file.history.forEach((hisFile) => {
            rm(path.join(HISTORY_DIR, hisFile), () => {});
          });
        }
      });
      projectItemStore.deleteFile(fileName);
      return;
    } catch (err) {
      return err as LocalError;
    }
  });

  async function _save(fileName: string, data: string) {
    const currentFilePath = path.join(SAVES_DIR, fileName);
    const tempFilePath = path.join(SAVES_DIR, SPLIT_SYMBOL + fileName);
    // 判断是否第一次保存
    if (existsSync(currentFilePath)) {
      try {
        renameSync(currentFilePath, tempFilePath);
        saveFile(fileName, data, SAVES_DIR);
        // 计算当前将要存为历史记录的文件 hash 和历史记录最后一个文件的hash
        const hash = await calculateFileHash(tempFilePath);
        const fileHistory = projectItemStore.getFile(fileName).history;
        if (fileHistory.length > 0) {
          const latestHistoryHashStr = fileHistory[fileHistory.length - 1].split(SPLIT_SYMBOL);
          if (latestHistoryHashStr && latestHistoryHashStr.length >= 3 && latestHistoryHashStr[2] === hash) {
            return;
          }
        }
        // 保存历史记录
        const historyName = moment().format('YYYY-MM-DD_HH-mm-ss') + SPLIT_SYMBOL + hash;
        renameSync(tempFilePath, path.join(HISTORY_DIR, historyName));
        const deletedHistory = projectItemStore.addFile(fileName, historyName);
        deletedHistory &&
          rm(path.join(HISTORY_DIR, deletedHistory), (e) => {
            console.warn(e);
          });
      } finally {
        existsSync(tempFilePath) && rm(tempFilePath, () => {});
      }
    } else {
      saveFile(fileName, data, SAVES_DIR);
      projectItemStore.addFile(fileName);
    }
  }
  ipcMain.handle('save-loads', (_evt, fileName: string, data: object) => {
    try {
      const stringifyData = stringifySave(data);
      if (fileCache.has(fileName)) {
        if (stringifyData === fileCache.get(fileName)) {
          return;
        }
      }
      _save(fileName, stringifyData);
      fileCache.set(fileName, stringifyData);
      return;
    } catch (err) {
      (err as LocalError).showMessage = 'Error saving local file because of error: ' + (err as LocalError).message;
      return err as LocalError;
    }
  });

  ipcMain.handle(
    'save-local-file',
    (_evt, fileName: string, data: string | Buffer, folder: string = SAVES_DIR): void | Error => {
      try {
        return saveFile(fileName, data, folder);
      } catch (err) {
        (err as LocalError).showMessage = 'Error saving local file because of error: ' + (err as LocalError).message;
        return err as LocalError;
      }
    },
  );

  ipcMain.handle('star-item', (_evt, filename: string, star: boolean) => {
    try {
      projectItemStore.setProperty(filename, 'star', star);
    } catch (err) {
      (err as LocalError).showMessage = 'Error saving local file because of error: ' + (err as LocalError).message;
      return err as LocalError;
    }
  });
}
