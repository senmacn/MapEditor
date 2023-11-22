import { ipcMain } from 'electron';
import { transformExrDir } from '../utils/exr-utils';
import {
  createShareLink,
  deleteFilesFromRemote,
  downloadShareFileFromRemote,
  executeShareLink,
  getFilesFromRemote,
  shareFileRemote,
} from '../utils/share';
import UserConfigStore from '../store/user-config-store';
import { stringifySave } from '../utils/json';

export default function () {
  // 用户设置
  const userConfig = UserConfigStore.getInstance().config;

  ipcMain.handle('concat-exr', (_evt, targetDir: string) => {
    try {
      return transformExrDir(targetDir);
    } catch (err) {
      (err as LocalError).showMessage = 'Error saving local file because of error: ' + (err as LocalError).message;
      return err as LocalError;
    }
  });

  ipcMain.handle('create-share-link', (_evt, filename: string, uuid: string) => {
    try {
      return createShareLink(userConfig.remoteURL, filename, uuid);
    } catch (err) {
      (err as LocalError).showMessage = 'Error saving local file because of error: ' + (err as LocalError).message;
      return err as LocalError;
    }
  });

  ipcMain.handle('execute-share-link', (_evt, link: string) => {
    try {
      return executeShareLink(userConfig.remoteURL, link);
    } catch (err) {
      (err as LocalError).showMessage = 'Error saving local file because of error: ' + (err as LocalError).message;
      return err as LocalError;
    }
  });

  ipcMain.handle('stringify-data', (_evt, obj: object) => {
    try {
      return stringifySave(obj);
    } catch (err) {
      (err as LocalError).showMessage = 'Error saving local file because of error: ' + (err as LocalError).message;
      return err as LocalError;
    }
  });

  ipcMain.handle('get-remote-files', (_evt) => {
    try {
      return getFilesFromRemote(userConfig.remoteURL);
    } catch (err) {
      (err as LocalError).showMessage = 'Error saving local file because of error: ' + (err as LocalError).message;
      return err as LocalError;
    }
  });

  ipcMain.handle('upload-remote-file', (_evt, filename: string) => {
    try {
      return shareFileRemote(userConfig.remoteURL, filename);
    } catch (err) {
      (err as LocalError).showMessage = 'Error saving local file because of error: ' + (err as LocalError).message;
      return err as LocalError;
    }
  });

  ipcMain.handle('download-remote-file', (_evt, filename: string) => {
    try {
      return downloadShareFileFromRemote(userConfig.remoteURL, filename);
    } catch (err) {
      (err as LocalError).showMessage = 'Error saving local file because of error: ' + (err as LocalError).message;
      return err as LocalError;
    }
  });

  ipcMain.handle('delete-remote-file', (_evt, filename: string) => {
    try {
      return deleteFilesFromRemote(userConfig.remoteURL, filename);
    } catch (err) {
      (err as LocalError).showMessage = 'Error saving local file because of error: ' + (err as LocalError).message;
      return err as LocalError;
    }
  });
}
