import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { getRandomDomId, randomHSLColor } from './random';

interface ExtendFile {
  name: string;
  property: {
    star: boolean;
    color: string;
  };
}

/**
 * 封装本地文件的一些读写属性的操作，替代数据库
 */
export class ProjectItemStore {
  static path = 'data/file-property.json';
  save_path: string;
  files: ExtendFile[] = [];
  constructor(save_path: string) {
    this.save_path = save_path;
  }
  init() {
    // 读取已有文件信息或创建新的
    if (existsSync(ProjectItemStore.path)) {
      this.files = JSON.parse(readFileSync(ProjectItemStore.path, 'utf8')) as ExtendFile[];
    } else {
      // 根据已有文件存档，创建 file-property.json
      const files = readdirSync(this.save_path)
        .filter((fileName) => fileName.endsWith('.json'))
        .map((fileName) => {
          const uuid = getRandomDomId();
          return {
            id: uuid,
            name: fileName,
            property: {
              star: false,
              color: randomHSLColor(),
            },
          };
        });
      writeFileSync(ProjectItemStore.path, JSON.stringify(files));
      this.files = files;
    }
  }

  setFileName(newName: string, originalName: string) {
    this.files.forEach((file) => {
      if (file.name === originalName) {
        file.name = newName;
      }
    });
    this.syncLocal();
  }

  setProperty(filename: string, key: string, value: any) {
    this.files.forEach((file) => {
      if (file.name === filename) {
        Reflect.set(file.property, key, value);
      }
    });
    this.syncLocal();
  }

  // 同步数据
  private syncLocal() {
    writeFileSync(ProjectItemStore.path, JSON.stringify(this.files));
  }
}
