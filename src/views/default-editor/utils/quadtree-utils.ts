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
  const blockWidth_CMs: number[] = [];

  // 分层计算
  for (let layerIndex = 0; layerIndex <= 15; layerIndex++) {
    // 第几层
    needRecord[layerIndex] = [];
    const layerWidth_CM = MAX_WIDTH_CM >> layerIndex;
    // 该层数据密度
    const grids = 1 << layerIndex;
    // 根据数据密度划分图块
    // 图块尺寸(对齐到最近的2的次方)
    const blocks = layerIndex >= 8 ? grids / 64 : grids;

    // 图块实际大小
    const blockWidth_CM = MAX_WIDTH_CM / blocks;
    blockWidth_CMs.push(blockWidth_CM);
    // 区块不可能占据某一块
    // 最小128cm
    if (layerWidth_CM < 128) break;

    // 其他层计算
    let layerData = new ArrayBuffer(grids * grids * 4);
    let layerDataView = new DataView(layerData);
    let dataFlag = false;
    let _offset = 0;
    for (let _y = 0; _y < blocks; _y++) {
      for (let _x = 0; _x < blocks; _x++) {
        let state;
        // 判断是否需要记录，不需要就直接跳过了
        if (layerIndex > 0 && needRecord[layerIndex - 1].length > 1) {
          let flag = false;
          const preLayerWidth_CM = blockWidth_CMs[layerIndex - 1];
          for (let _i = 0; _i < needRecord[layerIndex - 1].length; _i++) {
            const element = needRecord[layerIndex - 1][_i];
            if (
              element[0] * preLayerWidth_CM <= _x * blockWidth_CM &&
              (element[0] + 1) * preLayerWidth_CM > _x * blockWidth_CM &&
              element[1] * preLayerWidth_CM <= _y * blockWidth_CM &&
              (element[1] + 1) * preLayerWidth_CM > _y * blockWidth_CM
            ) {
              flag = true;
              break;
            }
          }
          if (!flag) {
            const num = layerDataView.getUint8(Math.floor(_offset / 8));
            const formatState = Number('0b' + '10') << (6 - (_offset % 8));
            layerDataView.setUint8(Math.floor(_offset / 8), num + formatState);
            _offset = _offset + 2;
            continue;
          }
        }
        // 加上区域的偏移量和delt [x, y] -> [0, 0]
        state = executeBlockState(
          imageData,
          blockWidth_CM,
          _x * blockWidth_CM - deltX_CM,
          _y * blockWidth_CM - deltY_CM,
        );
        const num = layerDataView.getUint8(Math.floor(_offset / 8));
        const formatState = Number('0b' + state) << (6 - (_offset % 8));
        layerDataView.setUint8(Math.floor(_offset / 8), num + formatState);
        _offset = _offset + 2;
        if (state == '01') {
          dataFlag = true;
        }
        if (state == '00' && blockWidth_CM > layerWidth_CM) {
          dataFlag = true;
          // 下一层第几块需要记录
          needRecord[layerIndex].push([_x, _y]);
          // 遍历图块中的单元格
          for (let indexY = 0; indexY < blocks; indexY++) {
            for (let indexX = 0; indexX < blocks; indexX++) {
              // 加上区域的偏移量和delt [x, y] -> [0, 0]
              const _state = executeBlockState(
                imageData,
                layerWidth_CM,
                (indexX * layerWidth_CM) / 128 - deltX_CM + (_x * blockWidth_CM) / 128,
                (indexY * layerWidth_CM) / 128 - deltY_CM + (_y * blockWidth_CM) / 128,
              );
              const num = layerDataView.getUint8(Math.floor(_offset / 8));
              layerDataView.setUint8(
                Math.floor(_offset / 8),
                num + (Number('0b' + _state) << (6 - (_offset % 8))),
              );
              _offset = _offset + 2;
            }
          }
        }
        if (state == '10') {
        }
      }
    }
    // 没有一个有数据的，跳过
    if (!dataFlag) {
      offsets[layerIndex] = layerIndex > 0 ? offsets[layerIndex - 1] + size[layerIndex - 1] : 0;
      size[layerIndex] = 0;

      continue;
    }
    // 用 1byte 的二进制位记录下图块尺寸（先默认等于分层块尺寸）
    let rawFormatLayerData = getBits(Math.log2(blocks), 8);
    let repeatFlag = 0;
    let _index = 0;
    let prevString = '';
    function _computeRepeat() {
      const repeatFlagLast = repeatFlag % 128;
      const repeatFlagCount = Math.floor(repeatFlag / 128);
      rawFormatLayerData = rawFormatLayerData + '11';
      for (let i = repeatFlagCount; i > 0; i--) {
        rawFormatLayerData = rawFormatLayerData + '1101111111';
      }
      if (repeatFlagLast > 1) {
        rawFormatLayerData = rawFormatLayerData + '110' + getBits(repeatFlagLast - 1, 7);
      }
      rawFormatLayerData = rawFormatLayerData + prevString;
      repeatFlag = 0;
    }
    while (_index < _offset) {
      const element = padZero(layerDataView.getUint8(Math.floor(_index / 8)).toString(2), 8).slice(
        _index % 8,
        (_index % 8) + 2,
      );
      // 单元格数据全部记录
      if (element == '00') {
        // 先计算一下（假如不是一上来就是00）
        prevString.length > 0 && prevString != '00' && _computeRepeat();
        // 跳过1个图块数据 记录 blocks ^2个单元格数据
        for (let i = 2; i < blocks * blocks * 2 + 2; i += 2) {
          const unitNum = padZero(layerDataView.getUint8(Math.floor(i / 8)).toString(2), 8);
          rawFormatLayerData =
            rawFormatLayerData + unitNum.slice((_index + i) % 8, ((_index + i) % 8) + 2);
        }
        _index = _index + 2 + 2 * blocks * blocks;
        prevString = '';
        repeatFlag = 0;
      } else {
        // 重复
        if (element === prevString) {
          // 最后一次直接计算重复
          if (_index === _offset - 2) {
            _computeRepeat();
          }
        } else {
          // 当前一次计算不为全计算时
          if (prevString != '' && prevString != '00') {
            // 不重复了计算（包括）上个状态之前的重复
            _computeRepeat();
          }
          // 最后一次直接加上未重复
          if (_index === _offset - 2) {
            rawFormatLayerData = rawFormatLayerData + '11' + element;
          }
        }
        _index = _index + 2;
        prevString = element;
        repeatFlag++;
      }
    }

    // 没到 1024 (1KB)则补全
    while (rawFormatLayerData.length % KB !== 0) {
      rawFormatLayerData = rawFormatLayerData + '1';
    }
    // 计算偏移字节数
    offsets[layerIndex] = offsets[layerIndex - 1] + size[layerIndex - 1];
    const offsetBytes = layerIndex > 0 ? offsets[layerIndex] * 1024 : 0;
    for (let index = 0; index < rawFormatLayerData.length / 32; index++) {
      view.setUint32(
        32 + offsetBytes + index * 4,
        Number('0b' + rawFormatLayerData.slice(index * 32, index * 32 + 32)),
      );
    }
    size[layerIndex] = rawFormatLayerData.length / KB;
    // 字节数
    max = BASE_BYTES + offsets[layerIndex] * 1024 + rawFormatLayerData.length / 8 + 1;
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

function nearestPowerOfTwo(n) {
  return Math.floor(Math.log2(n)) === Math.log2(n) ? n / 2 : Math.pow(2, Math.floor(Math.log2(n)));
}
