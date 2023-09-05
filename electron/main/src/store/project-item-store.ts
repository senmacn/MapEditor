import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { getRandomDomId, randomHSLColor } from '../utils/random';
import uniqBy from 'lodash-es/uniqBy';

interface ExtendFile {
  name: string;
  property: {
    star: boolean;
    color: string;
  };
  history: string[];
}

/**
 * 封装本地文件的一些读写属性的操作，替代数据库
 */
export class ProjectItemStore {
  path: string;
  save_path: string;
  files: ExtendFile[] = [];
  constructor(path: string, save_path: string) {
    this.path = path;
    this.save_path = save_path;
  }
  init() {
    // 读取已有文件信息或创建新的
    if (existsSync(this.path)) {
      this.files = JSON.parse(readFileSync(this.path, 'utf8')) as ExtendFile[];
      // 查询本地是否更改
      // const files = readdirSync(this.save_path)
      //   .filter((fileName) => fileName.endsWith('.json'))
      //   .map((fileName) => {
      //     return {
      //       name: fileName,
      //       property: {
      //         star: false,
      //         color: randomHSLColor(),
      //       },
      //     };
      //   });
    } else {
      // 根据已有文件存档，创建 file-property.json
      const files = readdirSync(this.save_path)
        .filter((fileName) => fileName.endsWith('.json'))
        .map((fileName) => {
          return {
            id: getRandomDomId(),
            name: fileName,
            property: {
              star: false,
              color: randomHSLColor(),
            },
            history: [],
          };
        });
      writeFileSync(this.path, JSON.stringify(files));
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

  getFile(filename: string) {
    for (let index = 0; index < this.files.length; index++) {
      const file = this.files[index];
      if (file.name === filename) {
        return file;
      }
    }
    throw new Error(`File ${filename} not exist`);
  }

  addFile(filename: string, historyName?: string): string | undefined {
    const file = this.files.find((file) => file.name === filename);
    if (!file) {
      this.files.push({
        name: filename,
        property: {
          star: false,
          color: randomHSLColor(),
        },
        history: [],
      });
      this.syncLocal();
    } else {
      if (historyName) {
        let rmFile;
        if (!Array.isArray(file.history)) file.history = [];
        if (file.history.length <= 10) {
          file.history.push(historyName);
        } else {
          file.history.push(historyName);
          rmFile = file.history.shift();
        }
        this.syncLocal();
        return rmFile;
      }
    }
  }

  deleteFile(filename: string) {
    const index = this.files.findIndex((file) => file.name === filename);
    if (index > -1) {
      this.files.splice(index, 1);
    }
    this.syncLocal();
  }

  // 同步数据
  private syncLocal() {
    this.files = uniqBy(this.files, 'name');
    writeFileSync(this.path, JSON.stringify(this.files));
  }
}
