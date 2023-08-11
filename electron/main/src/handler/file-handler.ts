import { ipcMain } from 'electron';
import { readdirSync, statSync, readFileSync, renameSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import { FILE_PATH, SAVES_DIR } from '../common/const';
import { ProjectItemStore } from '../store/project-item-store';
import { stringifySave } from '../utils/json';

function saveFile(fileName: string, data: string | Buffer, folder: string) {
  console.log(data);

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

  ipcMain.handle('get-local-history-list', () => {
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

  ipcMain.handle('get-local-file-content', (_evt, fileName: string) => {
    return readFileSync(path.join(SAVES_DIR, decodeURIComponent(fileName)), 'utf8');
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
      projectItemStore.deleteFile(fileName);
      return;
    } catch (err) {
      return err as LocalError;
    }
  });

  ipcMain.handle('save-loads', (_evt, fileName: string, data: Object) => {
    try {
      saveFile(fileName, stringifySave(data), SAVES_DIR);
      projectItemStore.addFile(fileName);
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
