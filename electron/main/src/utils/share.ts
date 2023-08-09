import * as AES from 'crypto-js/aes';
import { enc } from 'crypto-js';
import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import moment from 'moment';
import { SAVES_DIR } from '../common/const';

interface ShareLinkAttr {
  filename: string;
  resultName: string;
  uuid: string;
  expireDate: string;
}

const BASE_SHARE_LINK = 'MAP_EDITOR_LINK[%s]';
const BASE_SHARE_LINK_REG = /MAP_EDITOR_LINK\[(.+)\]/;
const SECRET_KEY = 'pwrd';

async function getFileFromRemote(remote: string, filename: string) {
  const url = remote + '/file/getfile/' + filename;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      responseType: 'text',
      responseEncoding: 'utf8',
    },
  });
  if (res.status === 200) {
    const data = await res.text();
    return data;
  } else {
    throw new Error('请求错误！');
  }
}

async function uploadFileFromRemote(remote: string, filePath: string) {
  const url = remote + '/file/uploadfile';
  const blob = new Blob([readFileSync(decodeURIComponent(filePath))]);
  const form = new FormData();
  form.append('file', blob);
  const res = await fetch(url, {
    method: 'POST',
    body: form,
  });
  if (res.status === 200) {
    const data = await res.text();
    return data;
  } else {
    throw new Error('请求错误！');
  }
}

function parseLink(link: string) {
  const res = link.match(BASE_SHARE_LINK_REG);
  if (!Array.isArray(res) || res?.length < 2) {
    throw new Error('无法识别链接！');
  }
  const aesData = AES.decrypt(res[1], SECRET_KEY).toString(enc.Utf8);
  const attr = JSON.parse(aesData) as ShareLinkAttr;
  // 暂时不定义有效期
  // const expireDate = Number(attr.expireDate);
  // if (expireDate < moment().valueOf()) {
  //   throw new Error('链接已过期！');
  // }
  return attr;
}

function compileLink(attr: Recordable) {
  return BASE_SHARE_LINK.replace('%s', AES.encrypt(JSON.stringify(attr), SECRET_KEY).toString());
}

export async function createShareLink(remoteURL: string, filename: string, uuid: string) {
  const resultName = await uploadFileFromRemote(remoteURL, path.join(SAVES_DIR, filename));
  const attr: ShareLinkAttr = {
    filename: filename,
    resultName: resultName,
    uuid: uuid,
    expireDate: moment().add(7, 'days').valueOf().toString(),
  };
  return compileLink(attr);
}

export async function executeShareLink(remoteURL: string, link: string) {
  const attr = parseLink(link);
  const filename = '分享-' + attr.filename;
  const data = await getFileFromRemote(remoteURL, attr.resultName);
  writeFileSync(path.join(SAVES_DIR, filename), data, {
    encoding: 'utf8',
  });
  return {
    name: filename,
    uuid: attr.uuid,
  };
}
