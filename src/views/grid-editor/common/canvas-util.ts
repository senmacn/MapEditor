import { CanvasConfig } from '../context/useCanvasConfig';
import _uniqWith from 'lodash-es/uniqWith';
import _isEqual from 'lodash-es/isEqual';

export class CanvasUtil {
  private config: CanvasConfig;
  constructor(config: CanvasConfig) {
    this.config = config;
  }
  setConfig(config: CanvasConfig) {
    this.config = config;
  }
  // 根据点击位置获取网格位置
  getGridByEvent(e: { offsetX: number; offsetY: number }): Point {
    const xGrid = Math.floor(e.offsetX / this.config.gridSize);
    const yGrid = Math.floor(e.offsetY / this.config.gridSize);
    return [xGrid, yGrid];
  }
  getGrid(offsetX: number, offsetY: number): Point {
    const xGrid = Math.floor(offsetX / this.config.gridSize);
    const yGrid = Math.floor(offsetY / this.config.gridSize);
    return [xGrid, yGrid];
  }
  // 获取两点之间的整数点
  getLines(from: Point, to: Point): Point[] {
    return getTouchedPosBetweenTwoPoints(from, to);
  }
  // 获取点击位置的网格
  getRect(xGrid: number, yGrid: number): Box{
    return [
      xGrid * this.config.gridSize + 1,
      yGrid * this.config.gridSize + 1,
      this.config.gridSize - 2,
      this.config.gridSize - 2,
    ];
  }
}

// 计算两点间经过的格子
function getTouchedPosBetweenTwoPoints(from: Point, to: Point): Point[] {
  const touchedGrids = getTouchedPosBetweenOrigin2Target([to[0] - from[0], to[1] - from[1]]);
  touchedGrids.forEach((point) => {
    point[0] = point[0] + from[0];
    point[1] = point[1] + from[1];
  });
  return touchedGrids;
}

// 计算目标位置到原点所经过的格子
function getTouchedPosBetweenOrigin2Target(target: Point): Point[] {
  const touched: Point[] = [];
  const steep: boolean = Math.abs(target[1]) > Math.abs(target[0]);
  const x = steep ? target[1] : target[0];
  const y = steep ? target[0] : target[1];
  //斜率
  const tangent = y / x;
  const delta = x > 0 ? 0.5 : -0.5;
  for (let i = 1; i < 2 * Math.abs(x); i++) {
    const tempX = i * delta;
    const tempY = tangent * tempX;
    const isOnEdge = Math.abs(tempY - Math.floor(tempY)) == 0.5;
    //偶数 格子内部判断
    if ((i & 1) == 0) {
      //在边缘,则上下两个格子都满足条件
      if (isOnEdge) {
        touched.push([Math.round(tempX), Math.ceil(tempY)]);
        touched.push([Math.round(tempX), Math.floor(tempY)]);
      }
      //不在边缘就所处格子满足条件
      else {
        touched.push([Math.round(tempX), Math.round(tempY)]);
      }
    }
    //奇数 格子边缘判断
    else {
      //在格子交点处,不视为阻挡,忽略
      if (isOnEdge) {
        continue;
      }
      //否则左右两个格子满足
      else {
        touched.push([Math.ceil(tempX), Math.round(tempY)]);
        touched.push([Math.floor(tempX), Math.round(tempY)]);
      }
    }
  }
  if (steep) {
    //镜像翻转 交换 X Y
    for (let i = 0; i < touched.length; i++) {
      const v = touched[i];
      v[0] = v[0] ^ v[1];
      v[1] = v[0] ^ v[1];
      v[0] = v[0] ^ v[1];

      touched[i] = v;
    }
  }
  return _uniqWith(touched, _isEqual);
}
