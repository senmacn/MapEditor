import { join } from 'path';
import { execFile } from 'child_process';
import { app } from 'electron';

interface ExeRunnerHandler {
  errHandler?: (e: Error) => void;
  stdoutHandler?: (stdout: string) => void;
  stderrHandler?: (stderr: string) => void;
}

/**
 * 使用 execFile 运行外部 .exe 文件
 * @param {string} exeFilePath 外部exe文件路径
 * @param {string[]} args 命命令行参数
 * @param {ExeRunnerHandler} errHandler 错误处理
 * @returns
 */
export default function runner(exeFilePath: string, args: string[], handler?: ExeRunnerHandler) {
  return new Promise((resolve, reject) => {
    execFile(exeFilePath, args, { shell: true }, (error, stdout, stderr) => {
      if (error && handler && handler.errHandler) {
        handler.errHandler(error);
        reject(stderr);
      }
      if (stderr && handler && handler.stderrHandler) {
        handler.stderrHandler(stderr);
        reject(stderr);
      }
      if (stdout && handler && handler.stdoutHandler) {
        handler.stdoutHandler(stdout);
      }
      resolve(stdout);
    });
  });
}

export function createShortcut() {
  const transformCommand = `/F:"${join(app.getPath('desktop'), 'mapeditor.lnk')}" /A:C /T:${process.execPath}`;
  const ToolPath = join(app.getAppPath(), 'tools', 'Shortcut.exe');
  console.log(transformCommand);

  runner(ToolPath, [transformCommand]);
}
