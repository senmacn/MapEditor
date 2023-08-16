import { ipcMain } from 'electron';
import {
  readdirSync,
  statSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
  rm,
  copyFileSync,
  existsSync,
} from 'fs';
import path from 'path';
import { FILE_PATH, HISTORY_DIR, SAVES_DIR } from '../common/const';
import { ProjectItemStore } from '../store/project-item-store';
import { stringifySave } from '../utils/json';
import { getRandomDomId } from '../utils/random';
import moment from 'moment';

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
        let property: Recordable = {};
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
      (err as LocalError).showMessage =
        'Error use local history because of error: ' + (err as LocalError).message;
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
              const result = readFileSync(
                path.join(HISTORY_DIR, decodeURIComponent(historyName)),
                'utf8',
              );
              _save(element.name, result);
            }
          }
        }
      }
    } catch (err) {
      (err as LocalError).showMessage =
        'Error use local history because of error: ' + (err as LocalError).message;
      return err as LocalError;
    }
  });

  ipcMain.handle(
    'rename-local-file',
    (_evt, fileName: string, newname: string): LocalResult<null> => {
      try {
        renameSync(path.join(SAVES_DIR, fileName), path.join(SAVES_DIR, newname));
        projectItemStore.setFileName(newname, fileName);
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

  function _save(fileName: string, data: Object) {
    // 同时保存历史记录
    const historyName = moment().format('YYYY-MM-DD_HH-mm-ss_') + getRandomDomId();
    // 判断是否第一次保存
    if (existsSync(path.join(SAVES_DIR, fileName))) {
      copyFileSync(path.join(SAVES_DIR, fileName), path.join(HISTORY_DIR, historyName));
    }
    saveFile(fileName, stringifySave(data), SAVES_DIR);
    const deletedHistory = projectItemStore.addFile(fileName, historyName);
    deletedHistory && rm(path.join(HISTORY_DIR, deletedHistory), () => {});
  }
  ipcMain.handle('save-loads', (_evt, fileName: string, data: Object) => {
    try {
      _save(fileName, data);
      return;
    } catch (err) {
      (err as LocalError).showMessage =
        'Error saving local file because of error: ' + (err as LocalError).message;
      return err as LocalError;
    }
  });

  ipcMain.handle(
    'save-local-file',
    (_evt, fileName: string, data: string | Buffer, folder: string = SAVES_DIR): void | Error => {
      try {
        return saveFile(fileName, data, folder);
      } catch (err) {
        (err as LocalError).showMessage =
          'Error saving local file because of error: ' + (err as LocalError).message;
        return err as LocalError;
      }
    },
  );

  ipcMain.handle('star-item', (_evt, filename: string, star: boolean) => {
    try {
      projectItemStore.setProperty(filename, 'star', star);
    } catch (err) {
      (err as LocalError).showMessage =
        'Error saving local file because of error: ' + (err as LocalError).message;
      return err as LocalError;
    }
  });
}
