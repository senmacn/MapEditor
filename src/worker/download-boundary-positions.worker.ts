import { getDistance2 } from '@/views/default-editor/utils/canvas-util';
import FloodSpread from '@/utils/q-floodfill/FloodSpread';

// 获取imageData中的点(离散,单层)
function getPosition(imageData: ImageData, choosePoint: [number, number], interval: number = 2) {
  // 洪水算法处理边界，并进行基础的XY方向排序
  const floodSpread = new FloodSpread(imageData);
  floodSpread.spread(choosePoint[0], choosePoint[1], 0);
  const result = floodSpread.getResults().sort((p1, p2) => (p1[1] * 10 + p1[0] > p2[1] * 10 + p2[0] ? 1 : -1));

  // 间隔取点
  const positions: Point[] = [];
  const basePositions: Point[] = [[0, 0]];
  for (let index = 0; index < result.length; index++) {
    const newP: Point = result[index];
    let flag = false;
    for (let index = 0; index < basePositions.length; index++) {
      const _p = basePositions[index];
      if (getDistance2(_p, newP) < interval) {
        flag = true;
        break;
      }
    }
    if (!flag) {
      positions.push(newP);
      basePositions.push(newP);
      if (basePositions.length >= 30) {
        basePositions.shift();
      }
    }
  }
  // 排序
  const sortedPoint: Point[] = [];
  let comparePoint = positions.pop() as Point;
  while (positions.length > 0) {
    let minPos = 100;
    let minIndex = -1;
    for (let index = 0; index < positions.length; index++) {
      const p = positions[index];
      const d = getDistance2(p, comparePoint);
      if (d < minPos) {
        minPos = d;
        minIndex = index;
      }
    }
    if (minIndex >= 0) {
      sortedPoint.push(comparePoint);
      comparePoint = positions.splice(minIndex, 1)[0];
    }
  }

  return sortedPoint;
}

addEventListener(
  'message',
  function (event) {
    const data = event.data;
    const [imageData, offsetX, offsetY, ltX, ltY, scale, type, choosePoint, interval] = data;
    const points = getPosition(imageData, choosePoint, interval);

    // 取转换厘米后方块中心点
    const formatPoints = points.map((point) => [
      Math.round(ltX + (point[0] + offsetX) * scale + 50),
      Math.round(ltY + (point[1] + offsetY) * scale + 50),
    ]);
    // const formatPoints = points.map((point) => [point[0] + offsetX, point[1] + offsetY]);
    postMessage({
      type: type,
      value: formatPoints,
    });
    this.self.close();
  },
  false,
);
