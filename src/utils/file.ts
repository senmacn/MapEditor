export function exportFile(filename: string, data: any, type?: string) {
  const element = document.createElement('a');
  let uri;
  switch (type) {
    case 'json':
      uri = getJsonDownloadUri(data);
      break;
    default:
      uri = getDownloadUri(data);
  }
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

function getJsonDownloadUri(data: any) {
  // 为了使文件以utf-8的编码模式，同时也是解决中文乱码的问题
  const _utf = '\uFEFF';
  const blob = new Blob([_utf + data], {
    type: 'text/json',
  });
  return URL.createObjectURL(blob);
}

export function checkFileName(fileName: string) {
  var reg = /^[a-zA-Z0-9_\.-]{1,16}$/;
  return reg.test(fileName);
}
