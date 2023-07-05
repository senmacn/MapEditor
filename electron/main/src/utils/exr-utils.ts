import * as fs from 'fs';
import * as path from 'path';
import exeRunner from './exe-runner';

// TODO: 获取当前项目目录
const EXR_TOOL = path.join(__dirname, '..', '..', '..', 'tools', 'rexr.exe');
const TRANSFORM_COMMAND_BASE = 'transform -D ';
const CONCAT_COMMAND_BASE = 'concat -o ';

const IndexReKey = /_(\d+_\d+).exr/i;

export async function transformExrDir(target: string) {
  const files = fs.readdirSync(target);
  if (files.length === 0) {
    throw new Error('空文件夹！');
  }
  const targetFilePath = path.join(target, 'concat.png');
  let transformCommand = TRANSFORM_COMMAND_BASE;
  let concatCommand = CONCAT_COMMAND_BASE + targetFilePath;
  let exrFiles;
  try {
    // 过滤出所有 .exr 文件并排序
    const exrMap = new Map();
    const perLineMap = new Map();
    exrFiles = files
      .filter((file) => {
        if (path.extname(file).toLowerCase() === '.exr') {
          const result = file.match(IndexReKey);
          if (result && result[1]) {
            const value = result[1].split('_');
            if (perLineMap.has(value[0])) {
              perLineMap.set(value[0], perLineMap.get(value[0]) + 1);
            } else {
              perLineMap.set(value[0], 1);
            }
            // (filename, quality)
            exrMap.set(file, Number(value[0]) * 100 + Number(value[0]));
            return true;
          } else {
            return false;
          }
        }
        return false;
      })
      // 排序
      .sort((a, b) => exrMap.get(a) - exrMap.get(b))
      .map((file) => path.join(target, file));

    // 修改每行数量
    concatCommand =
      concatCommand + ' --image-per-line ' + perLineMap.get(perLineMap.keys().next().value);

    // 构建命令行参数
    exrFiles.forEach((fileName) => {
      transformCommand = transformCommand + ' -F ' + fileName;
      concatCommand = concatCommand + ' -F ' + fileName + '.png';
    });

    // TODO: cmd 参数限制8192，处理一下
    // const commandDir = path.join(__dirname, 'command.txt');
    // 开始转换
    // fs.writeFileSync(commandDir, transformCommand, 'utf8');
    await exeRunner(EXR_TOOL, [transformCommand]);
    // 开始合并
    // fs.writeFileSync(commandDir, concatCommand, 'utf8');
    await exeRunner(EXR_TOOL, [concatCommand]);

    const data = fs.readFileSync(targetFilePath);

    // 删除中间文件
    // fs.rm(commandDir, () => {});
    fs.rm(targetFilePath, () => {});
    exrFiles.forEach((file) => {
      fs.rm(file + '.png', () => {});
    });

    return 'data:image/png;base64,' + data.toString('base64');
  } catch (err) {
    // 删除中间文件
    // fs.rm(commandDir, () => {});
    fs.rm(targetFilePath, () => {});
    exrFiles?.forEach((file) => {
      fs.rm(file + '.png', () => {});
    });

    throw err;
  }
}
