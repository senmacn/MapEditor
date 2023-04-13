export function exportFile(filename: string, data: any) {
  const element = document.createElement('a');
  const uri = getDownloadUri(data);
  element.href = uri;
  element.download = filename;
  const a = document.body.appendChild(element);
  a.click();
  document.body.removeChild(element);
}

function getDownloadUri(data: ArrayBuffer) {
  // 为了使文件以utf-8的编码模式，同时也是解决中文乱码的问题
  // const _utf = '\uFEFF';
  // const blob = new Blob([data], {
  //   type: 'application/octet-stream',
  // });
  const blob = new Blob([data]);
  return URL.createObjectURL(blob);
}

export function checkFileName(fileName: string) {
  var reg = /^[a-zA-Z0-9_]{2,16}$/;
  return reg.test(fileName);
}
