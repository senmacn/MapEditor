import { getPositionCount, isPointInData } from './image-data-util';

const KB = 1024 * 8;
const BASE_BYTES = 31;

// @ts-ignore
window.dataToBin = dataToBin;

/**
 * 获取压缩数据（TODO: 传入矩形边框数据用于加速计算）
 * @param imageData 图像数据
 * @param x 矩形边框最小点x
 * @param y 矩形边框最小点y
 * @param xWidth 矩形边框宽度
 * @param xHeight 矩形边框高度
 * @returns 压缩数据 ArrayBuffer
 */
export function dataToBin(imageData: ImageData, x: number, y: number, xWidth, xHeight) {
  const MAX_WIDTH = upper_pow_two(imageData.width);
  const buffer = new ArrayBuffer(Math.pow(MAX_WIDTH, 2));
  // 开头有32个字节用来标识偏移
  const view = new DataView(buffer);
  const offsets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  // 分层计算
  for (let layer = 1; layer < 30; layer++) {
    const layerWidth = MAX_WIDTH >> layer;
    const layerBlocks = 2 << layer;
    // 最底层跑完了，跳出
    if (layerWidth === 0) break;
    // 区块不可能占据某一块
    if (xWidth < layerWidth || xHeight < layerWidth) {
      continue;
    }
    // 其他层计算
    let layerData = '';
    let dataFlag = false;
    for (let _y = 0; _y < layerBlocks; _y++) {
      for (let _x = 0; _x < layerBlocks; _x++) {
        // 最后一层计算
        if (layerWidth === 1) {
          const pointStartIndex = _x * 4 + _y * 4 * imageData.width;
          if (isPointInData(imageData.data, pointStartIndex)) {
            layerData = layerData + '01';
          } else {
            layerData = layerData + '00';
          }
        } else {
          const count = getPositionCount(
            imageData,
            _x * layerWidth,
            _y * layerWidth,
            layerWidth,
            layerWidth,
          );
          if (count === layerWidth * layerWidth) {
            // 有数据 0b01
            layerData = layerData + '01';
            dataFlag = true;
          } else if (count === 0) {
            // 没有数据 0b00
            layerData = layerData + '00';
          } else {
            // 需要下探 0b10
            layerData = layerData + '10';
          }
        }
      }
    }
    // 没有一个有数据的，跳过
    if (!dataFlag) {
      continue;
    }
    // 用 1byte 的二进制位记录下图块尺寸（先默认等于分层块尺寸）
    let formatLayerData = getBits(layerWidth, 8);
    let repeatFlag = 1;
    let prevString = '';
    function computeRepeat() {
      const repeatFlagLast = repeatFlag % 127;
      const repeatFlagCount = Math.floor(repeatFlag / 127);
      formatLayerData = formatLayerData + '11';
      for (let i = repeatFlagCount; i > 0; i--) {
        formatLayerData = formatLayerData + '1101111111';
      }
      if (repeatFlagLast) {
        formatLayerData = formatLayerData + '110' + getBits(repeatFlagLast, 7);
      }
      formatLayerData = formatLayerData + prevString;
    }
    for (let index = 0; index < layerData.length; index = index + 2) {
      const element = layerData.slice(index, index + 2);
      // 重复
      if (element === prevString) {
        repeatFlag++;
        // 最后一次直接计算重复
        if (index === layerData.length - 2) {
          computeRepeat();
        }
      } else {
        // 不重复了计算（包括）上个状态之前的重复
        if (repeatFlag > 1) {
          computeRepeat();
        } else {
          // 未重复，直接加上上个状态
          formatLayerData = formatLayerData + prevString;
        }
        // 最后一次直接加上未重复
        if (index === layerData.length - 2) {
          formatLayerData = formatLayerData + element;
        }
        repeatFlag = 1;
      }
      prevString = element;
    }
    // 没到 1024 (1KB)则补全
    while (formatLayerData.length % KB !== 0) {
      formatLayerData = formatLayerData + '1';
    }
    offsets[layer - 1] = formatLayerData.length / KB;
    for (let index = 0; index < formatLayerData.length / 64; index++) {
      const offset = layer > 1 ? (offsets[layer - 1] * KB) / 8 : 0;
      view.setFloat64(
        BASE_BYTES + offset + index * 8,
        Number('0b' + formatLayerData.slice(index * 64, index * 64 + 64)),
      );
    }
  }
  offsets.forEach((offset, index) => {
    view.setInt16(index * 2, offset);
  });

  return buffer;
}

function upper_pow_two(n: number) {
  if (n <= 1) return 1;
  n--;
  n |= n >> 1;
  n |= n >> 2;
  n |= n >> 4;
  n |= n >> 8;
  n |= n >> 16;
  n++;
  return n;
}

function getBits(n: number, p: number) {
  let bits = n.toString(2);
  while (bits.length < p) {
    bits = '0' + bits;
  }
  return bits;
}
