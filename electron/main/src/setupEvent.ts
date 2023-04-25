import type { BrowserWindow } from 'electron';
import { ipcMain } from 'electron';

export default function setupEvent(mainWindow: BrowserWindow) {
  ipcMain.handle('window-close', () => {
    mainWindow.close();
  });

  ipcMain.handle('window-minimize', (_, arg: boolean) => {
    if (arg) {
      mainWindow.hide();
    } else {
      mainWindow.minimize();
    }
  });
}
