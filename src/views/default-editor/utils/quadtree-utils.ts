import ExtendedDataView from '@/utils/dataview';
import { getPositionCount, isPointInData } from './image-data-util';

const KB = 1024 * 8;
const BASE_BYTES = 31;

/**
 * 获取压缩数据（TODO: 传入矩形边框数据用于加速计算）
 * @param imageData 图像数据
 * @param posX 矩形边框最小点x
 * @param posY 矩形边框最小点y
 * @param mapSizeX 地图大小
 * @param mapSizeY 地图大小
 * @returns 压缩数据 ArrayBuffer
 */
export function dataToBin(
  imageData: ImageData,
  posX: number,
  posY: number,
  mapSizeX: number,
  mapSizeY: number,
  scale: number,
) {
  // 精确到厘米
  const MAX_WIDTH_CM = upper_pow_two(mapSizeX > mapSizeY ? mapSizeX * scale : mapSizeY * scale);
  const buffer = new ArrayBuffer(1024 * 1024 * 10);
  const deltX_CM = (MAX_WIDTH_CM - mapSizeX * scale) / 2 + posX * scale;
  const deltY_CM = (MAX_WIDTH_CM - mapSizeY * scale) / 2 + posY * scale;
  // 开头有32个字节用来标识偏移
  const view = new DataView(buffer);
  const offsets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const size = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let max = 0;
  const needRecord: Recordable<[number, number, number][]> = {};
  // 分层计算
  for (let layerIndex = 0; layerIndex <= 15; layerIndex++) {
    // 第几层
    needRecord[layerIndex] = [];
    const layerWidth_CM = MAX_WIDTH_CM >> layerIndex;
    // 该层数据密度
    const grids = 1 << layerIndex;
    // 根据数据密度划分图块
    let blocks = grids;
    switch (layerIndex) {
      case 7:
        blocks = 1 << 1;
        break;
      case 8:
        blocks = 1 << 2;
        break;
      case 9:
        blocks = 1 << 2;
        break;
      case 10:
        blocks = 1 << 3;
        break;
      case 11:
        blocks = 1 << 3;
        break;
      case 12:
        blocks = 1 << 4;
        break;
      case 13:
        blocks = 1 << 4;
        break;
      default:
        blocks = grids;
        break;
    }
    // 图块尺寸
    const blockSize = grids / blocks;
    // 图块实际大小
    const blockWidth_CM = MAX_WIDTH_CM / blockSize;
    // 最小
    if (layerWidth_CM < 128) break;
    let layerDataView = new ExtendedDataView(layerIndex >= 6 ? (layerIndex >= 8 ? (grids * grids) / 16 : 4096) : 1024);
    // 用 1byte 的二进制位记录下图块尺寸（先默认等于分层块尺寸）
    layerDataView.addByte(Math.log2(blocks));
    let dataFlag = false;
    let prevData: number | null = null;
    let repeatFlag = 0;
    const _computeRepeat = (element: number | null) => {
      // 第一项重复或是后续重复直接++返回
      if (element !== null && (element === prevData || repeatFlag === 0)) {
        repeatFlag++;
        prevData = element;
        return;
      }
      // <0b11-(0b110-0b{7})*-0b{2}>
      if (repeatFlag === 1) {
        layerDataView.addTwoBits(0b11);
        layerDataView.addTwoBits(prevData);
      }
      if (repeatFlag > 1) {
        layerDataView.addTwoBits(0b11);
        // 满 127 一个 0b110-0b{7}1111111 不计当前
        const repeatFlagCount = Math.floor((repeatFlag - 1) / 127);
        for (let i = 0; i < repeatFlagCount; i++) {
          layerDataView.addStr('1101111111');
        }
        // 剩余的 不计当前
        const repeatFlagLast = (repeatFlag - 1) % 127;
        if (repeatFlagLast >= 1) {
          layerDataView.addStr('110' + getBits(repeatFlagLast, 7));
        }
        layerDataView.addTwoBits(prevData);
      }
      if (element !== null) {
        repeatFlag = 1;
        prevData = element as number;
      } else {
        repeatFlag = 0;
        prevData = null;
      }
    };
    for (let _y = 0; _y < blockSize; _y++) {
      for (let _x = 0; _x < blockSize; _x++) {
        // 第0层不需要考虑00
        if (layerIndex === 0) continue;
        let _states = '';
        const _statesNum = { '01': 0, '10': 0, '00': 0 };
        // 遍历图块中的单元格
        for (let indexY = 0; indexY < blocks; indexY++) {
          for (let indexX = 0; indexX < blocks; indexX++) {
            // 判断是否需要记录，不需要就直接跳过了
            if (needRecord[layerIndex - 1].length > 0) {
              let flag = false;

              for (let _i = 0; _i < needRecord[layerIndex - 1].length; _i++) {
                const element = needRecord[layerIndex - 1][_i];
                if (
                  element[0] <= _x * blockWidth_CM + indexX * layerWidth_CM &&
                  element[0] + element[2] > _x * blockWidth_CM + indexX * layerWidth_CM &&
                  element[1] <= _y * blockWidth_CM + indexY * layerWidth_CM &&
                  element[1] + element[2] > _y * blockWidth_CM + indexY * layerWidth_CM
                ) {
                  flag = true;
                  break;
                }
              }

              if (!flag) {
                _states = _states + '00';
                _statesNum['00']++;
                continue;
              }
            }
            // 加上图块的偏移量和delt [x, y] -> [0, 0]
            const _state = executeBlockState(
              imageData,
              layerWidth_CM,
              indexX * layerWidth_CM - deltX_CM + _x * blockWidth_CM,
              indexY * layerWidth_CM - deltY_CM + _y * blockWidth_CM,
              scale,
            );
            _states = _states + _state;
            _statesNum[_state]++;
            // 最后一层不记了
            if (_state === '00' && layerWidth_CM > 128) {
              // 下一层第几块需要记录
              needRecord[layerIndex].push([
                _x * blockWidth_CM + indexX * layerWidth_CM,
                _y * blockWidth_CM + indexY * layerWidth_CM,
                layerWidth_CM,
              ]);
            }
          }
        }

        // 状态一致
        if (_statesNum['00'] === blocks * blocks) {
          _computeRepeat(0b00);
        } else if (_statesNum['01'] === blocks * blocks) {
          dataFlag = true;
          _computeRepeat(0b01);
        } else if (_statesNum['10'] === blocks * blocks) {
          _computeRepeat(0b10);
        } else {
          // 状态不一致，先计算之前的重复区块
          repeatFlag > 0 && prevData !== null && _computeRepeat(null);
          dataFlag = true;
          layerDataView.addStr(_states);
        }
      }
    }
    repeatFlag > 0 && prevData !== null && _computeRepeat(null);
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

    layerDataView.freemem();
    // @ts-ignore
    layerDataView = null;
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

function getBits(n: number, p: number) {
  let bits = n.toString(2);
  if (bits.length > p) throw new Error('bits length overflow');
  while (bits.length < p) {
    bits = '0' + bits;
  }
  return bits;
}

function executeBlockState(imageData, width_cm, x_cm, y_cm, scale) {
  const x = Math.floor(x_cm / scale);
  const y = Math.floor(y_cm / scale);
  // 最后一层计算
  if (width_cm / 2 < 128) {
    // 防止x y分别不在区域内，但计算值在
    if (x >= 0 && y >= 0 && x < imageData.width && y < imageData.height) {
      const pointStartIndex = x * 4 + y * 4 * imageData.width;
      if (isPointInData(imageData.data, pointStartIndex)) {
        return '01';
      } else {
        return '10';
      }
    }
    return '10';
  } else {
    const pointCount = Math.floor(width_cm / scale);
    // 加上区域的偏移量 [x, y] -> [0, 0]
    const count = getPositionCount(imageData, x, y, pointCount, pointCount);
    // 考虑计算偏差
    if (count >= pointCount * pointCount - 2) {
      // 有数据 0b01
      return '01';
    }
    if (count < 2) {
      // 没有数据 0b10
      return '10';
    }
    // 需要下探 0b00
    return '00';
  }
}
