import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import setupEvent from './setupEvent';

async function createWindow() {
  const browserWindow = new BrowserWindow({
    fullscreen: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
      webviewTag: true,
      preload: join(app.getAppPath(), 'electron/preload/dist/index.cjs'),
    },
    icon: join(app.getAppPath(), 'src/assets/ico/map32.ico'),
    titleBarStyle: 'hidden',
    frame: false,
    width: 1000,
    height: 650,
    resizable: false,
  });

  browserWindow.webContents.setWindowOpenHandler(({}) => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        nodeIntegration: true,
        frame: false,
        width: 1600,
        webSecurity: false,
        height: 1024,
        minWidth: 1600,
        minHeight: 1024,
        webPreferences: {
          preload: join(app.getAppPath(), 'electron/preload/dist/index.cjs'),
        },
      },
    };
  });

  browserWindow.on('ready-to-show', () => {
    browserWindow?.show();

    // if (import.meta.env.DEV) {
      browserWindow?.webContents.openDevTools();
    // }
  });

  const pageUrl =
    import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL !== undefined
      ? import.meta.env.VITE_DEV_SERVER_URL
      : 'http://10.7.1.194:7789/';

  await browserWindow.loadURL(pageUrl);

  return browserWindow;
}

/**
 * Restore an existing BrowserWindow or Create a new BrowserWindow.
 */
export async function restoreOrCreateWindow() {
  let window = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());

  if (window === undefined) {
    window = await createWindow();
  }

  if (window.isMinimized()) {
    window.restore();
  }

  window.focus();

  setupEvent(window);

  return window;
}
