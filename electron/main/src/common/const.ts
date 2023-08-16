import { join } from 'path';
import { app } from 'electron';

export const DATA_DIR = join(app.getPath('userData'), 'mapeditor_data');
export const SAVES_DIR = join(app.getPath('userData'), 'mapeditor_data', 'saves');
export const HISTORY_DIR = join(app.getPath('userData'), 'mapeditor_data', 'saves', 'history');
export const CONFIG_PATH = join(app.getPath('userData'), 'mapeditor_data', 'config.json');
export const FILE_PATH = join(app.getPath('userData'), 'mapeditor_data', 'file-property.json');
