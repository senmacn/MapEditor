import { isPointInData } from '@/views/default-editor/utils/image-data-util';
import isEqual from 'lodash-es/isEqual';
import uniqWith from 'lodash-es/uniqWith';
import filter from 'lodash-es/filter';
// import simplify from 'simplify-js';
import { getDistance } from '@/views/default-editor/utils/canvas-util';

function getCentroid(points: PointA[]) {
  let xSum = 0;
  let ySum = 0;

  for (const point of points) {
    xSum += point.x;
    ySum += point.y;
  }

  return { x: xSum / points.length, y: ySum / points.length };
}

function sortVertices(points: PointA[]) {
  const centroid = getCentroid(points);

  return points.sort((a, b) => {
    const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
    const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);

    return angleA - angleB;
  });
}

// 获取imageData中的点(离散,单层)
function getPosition(imageData: ImageData) {
  const positions: PointA[] = [];
  // imageData.data 大小为 height * width * 4，每4个值组成一个点，从左向右从上到下
  for (let yIndex = 0; yIndex <= imageData.height; yIndex++) {
    for (let xIndex = 0; xIndex <= imageData.width; xIndex++) {
      const pointStartIndex = xIndex * 4 + yIndex * 4 * imageData.width;
      if (isPointInData(imageData.data, pointStartIndex)) {
        positions.push({ x: xIndex, y: yIndex });
      }
    }
  }

  // 通过 simplify 做一下单层
  // const pointsA = simplify(
  //   positions.sort((a, b) => a.x + a.y - b.x - b.y),
  //   5,
  //   true,
  // );
  // const pointsB = simplify(
  //   positions.sort((a, b) => -a.x + a.y + b.x - b.y),
  //   5,
  //   true,
  // );
  const simplePoints = uniqWith(positions, isEqual);

  let sortedPoints = sortVertices(simplePoints);
  sortedPoints = filter(
    uniqWith(sortedPoints, (p1, p2) => getDistance(p1, p2) <= 1),
    (_, index) => index % 4 === 0,
  );
  return sortedPoints;
}

addEventListener(
  'message',
  function (event) {
    const data = event.data;
    const [imageData, offsetX, offsetY, ltX, ltY, scale, type] = data;
    const points = getPosition(imageData);

    // 取转换厘米后方块中心点
    const formatPoints = points.map((point) => [
      Math.round(ltX + (point.x + offsetX) * scale + 50),
      Math.round(ltY + (point.y + offsetY) * scale + 50),
    ]);
    // const formatPoints = points.map((point) => [point.x + offsetX, point.y + offsetY]);
    postMessage({
      type: type,
      value: formatPoints,
    });
    this.self.close();
  },
  false,
);
