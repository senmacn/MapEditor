import ExtendedDataView from '@/utils/dataview';
import { getPositionCount, isPointInData } from './image-data-util';

const KB = 1024 * 8;
const BASE_BYTES = 31;

// @ts-ignore
window.dataToBin = dataToBin;

/**
 * 获取压缩数据（TODO: 传入矩形边框数据用于加速计算）
 * @param imageData 图像数据
 * @param posX 矩形边框最小点x
 * @param posY 矩形边框最小点y
 * @param xWidth 矩形边框宽度
 * @param xHeight 矩形边框高度
 * @param mapSizeX 地图大小
 * @param mapSizeY 地图大小
 * @returns 压缩数据 ArrayBuffer
 */
export function dataToBin(
  imageData: ImageData,
  posX: number,
  posY: number,
  xWidth,
  xHeight,
  mapSizeX: number,
  mapSizeY: number,
) {
  // 精确到厘米
  const MAX_WIDTH_CM = upper_pow_two(mapSizeX > mapSizeY ? mapSizeX * 128 : mapSizeY * 128);
  const buffer = new ArrayBuffer(Math.pow(MAX_WIDTH_CM, 2) / 800);
  const deltX_CM = (MAX_WIDTH_CM - mapSizeX * 128) / 2 + posX * 128;
  const deltY_CM = (MAX_WIDTH_CM - mapSizeY * 128) / 2 + posY * 128;
  // 开头有32个字节用来标识偏移
  const view = new DataView(buffer);
  const offsets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const size = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let max = 0;
  const needRecord: Recordable<[number, number][]> = {};

  // 分层计算
  for (let layerIndex = 0; layerIndex <= 15; layerIndex++) {
    // 第几层
    needRecord[layerIndex] = [];
    const layerWidth_CM = MAX_WIDTH_CM >> layerIndex;
    // 该层数据密度
    const grids = 1 << layerIndex;
    // 根据数据密度划分图块
    const blocks = layerIndex >= 8 ? 8 : grids;
    // 图块尺寸
    const blockSize = grids / blocks;
    // 图块实际大小
    const blockWidth_CM = MAX_WIDTH_CM / blockSize;
    // 区块不可能占据某一块
    // 最小128cm
    if (layerWidth_CM < 128) break;

    let layerDataView = new ExtendedDataView(layerIndex >= 8 ? (grids * grids) / 16 : 5120);
    // 用 1byte 的二进制位记录下图块尺寸（先默认等于分层块尺寸）
    layerDataView.addByte(Math.log2(blocks));
    let dataFlag = false;
    let prevData: number | null = null;
    let repeatFlag = 0;
    function _computeRepeat(element: number | null) {
      if (element !== null && element === prevData) {
        repeatFlag++;
        return;
      }
      if (element !== null && repeatFlag == 0) {
        repeatFlag++;
        prevData = element;
        return;
      }
      // <0b11-(0b110-0b{7})*-0b{2}>
      if (repeatFlag === 1) {
        layerDataView.addTwoBits(0b11);
        layerDataView.addTwoBits(prevData);
      } else {
        layerDataView.addTwoBits(0b11);
        // 满 127 一个 0b110-0b{7}1111111 不计当前
        const repeatFlagCount = Math.floor((repeatFlag - 1) / 127);
        for (let i = repeatFlagCount; i > 0; i--) {
          layerDataView.addStr('1101111111');
        }
        // 剩余的 不计当前
        const repeatFlagLast = (repeatFlag - 1) % 127;
        if (repeatFlagLast >= 1) {
          layerDataView.addStr('110' + getBits(repeatFlagLast, 7));
        }
        layerDataView.addTwoBits(prevData);
      }
      if (element != null) {
        repeatFlag = 1;
        prevData = element as number;
      } else {
        repeatFlag = 0;
        prevData = null;
      }
    }
    for (let _y = 0; _y < blockSize; _y++) {
      for (let _x = 0; _x < blockSize; _x++) {
        // 第0层不需要考虑00
        if (layerIndex == 0) continue;
        let _states = '';
        let _statesNum = { '01': 0, '10': 0, '00': 0 };
        // 遍历图块中的单元格
        for (let indexY = 0; indexY < blocks; indexY++) {
          for (let indexX = 0; indexX < blocks; indexX++) {
            // 判断是否需要记录，不需要就直接跳过了
            if (layerIndex > 0 && needRecord[layerIndex - 1].length > 0) {
              let flag = false;
              for (let _i = 0; _i < needRecord[layerIndex - 1].length; _i++) {
                const element = needRecord[layerIndex - 1][_i];
                if (
                  element[0] * 2 <= _x * blocks + indexX &&
                  (element[0] + 1) * 2 > _x * blocks + indexX &&
                  element[1] * 2 <= _y * blocks + indexY &&
                  (element[1] + 1) * 2 > _y * blocks + indexY
                ) {
                  flag = true;
                  break;
                }
              }
              if (!flag) {
                _states += '10';
                _statesNum[10]++;
                continue;
              }
            }
            // 加上区域的偏移量和delt [x, y] -> [0, 0]
            const _state = executeBlockState(
              imageData,
              layerWidth_CM,
              indexX * layerWidth_CM - deltX_CM + _x * blockWidth_CM,
              indexY * layerWidth_CM - deltY_CM + _y * blockWidth_CM,
            );
            if (_state === '00') {
              // 下一层第几块需要记录
              needRecord[layerIndex].push([_x * blocks + indexX, _y * blocks + indexY]);
            }
            _states += _state;
            _statesNum[_state]++;
          }
        }
        // 取余等于0，状态一致
        if (_statesNum['00'] === blocks * blocks) {
          dataFlag = true;
          _computeRepeat(0b00);
        } else if (_statesNum['01'] === blocks * blocks) {
          dataFlag = true;
          _computeRepeat(0b01);
        } else if (_statesNum['10'] === blocks * blocks) {
          _computeRepeat(0b10);
        } else {
          dataFlag = true;
          repeatFlag > 0 && _computeRepeat(null);
          layerDataView.addStr(_states);
        }
      }
    }
    repeatFlag > 0 && _computeRepeat(null);
    // 没有一个有数据的，跳过
    if (!dataFlag) {
      offsets[layerIndex] = layerIndex > 0 ? offsets[layerIndex - 1] + size[layerIndex - 1] : 0;
      size[layerIndex] = 0;
      layerIndex >= 1 && delete needRecord[layerIndex - 1];
      continue;
    }

    // 没到 1024 (1KB)则补全
    while (layerDataView.getBitsLength() % KB !== 0) {
      layerDataView.addBit(1);
    }
    // 计算偏移字节数
    offsets[layerIndex] = offsets[layerIndex - 1] + size[layerIndex - 1];
    const offsetBytes = offsets[layerIndex] * 1024;
    for (let index = 0; index < layerDataView.getDataLength(); index++) {
      view.setUint8(32 + offsetBytes + index, layerDataView.readByte(index));
    }
    size[layerIndex] = layerDataView.getDataLength() / 1024;
    // 字节数
    max = BASE_BYTES + offsets[layerIndex] * 1024 + layerDataView.getDataLength() + 1;
    layerIndex > 1 && delete needRecord[layerIndex - 1];
  }
  offsets.forEach((offset, index) => {
    view.setUint16(index * 2, offset);
  });
  // throw new Error();
  return buffer.slice(0, max);
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

function padZero(str, x) {
  if (typeof str !== 'string') {
    str = str.toString();
  }

  while (str.length < x) {
    str = '0' + str;
  }

  return str;
}

function getBits(n: number, p: number) {
  let bits = n.toString(2);
  while (bits.length < p) {
    bits = '0' + bits;
  }
  return bits;
}

function executeBlockState(imageData, blockWidth_cm, x_cm, y_cm) {
  const x = Math.floor(x_cm / 128);
  const y = Math.floor(y_cm / 128);
  // 最后一层计算
  if (blockWidth_cm <= 128) {
    // 防止x y分别不在区域内，但计算值在
    if (x >= 0 && y >= 0 && x < imageData.width && y < imageData.height) {
      const pointStartIndex = x * 4 + y * 4 * imageData.width;
      if (isPointInData(imageData.data, pointStartIndex)) {
        return '01';
      } else {
        return '10';
      }
    } else {
      return '10';
    }
  } else {
    const pointCount = Math.floor(blockWidth_cm / 128);
    // 加上区域的偏移量 [x, y] -> [0, 0]
    const count = getPositionCount(imageData, x, y, pointCount, pointCount);
    // 考虑计算偏差
    if (count >= pointCount * pointCount - 1) {
      // 有数据 0b01
      return '01';
    } else if (count === 0) {
      // 没有数据 0b10
      return '10';
    } else {
      // 需要下探 0b00
      return '00';
    }
  }
}
