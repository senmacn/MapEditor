import { checkFileName } from '@/utils/file';
import { message } from 'ant-design-vue';

export function checkAreaName(areaName: string) {
  if (!areaName.length) {
    message.warning('请填写区域标识！');
    return false;
  }
  if (!checkFileName(areaName)) {
    message.warning('格式错误！区域标识只支持字母、数字和 . _ - 等符号！');
    return false;
  }
  return true;
}
