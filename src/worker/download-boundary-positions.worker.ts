import { isPointInData } from '@/views/default-editor/utils/image-data-util';
import isEqual from 'lodash-es/isEqual';
import uniqWith from 'lodash-es/uniqWith';
import simplify from 'simplify-js';

// 获取imageData中的点(离散)
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
  const pointsA = simplify(
    positions.sort((a, b) => a.x + a.y - b.x - b.y),
    5,
    true,
  );
  const pointsB = simplify(
    positions.sort((a, b) => a.x - a.y - b.x + b.y),
    5,
    true,
  );
  return uniqWith(pointsA.concat(pointsB), isEqual);
}

addEventListener(
  'message',
  function (event) {
    const data = event.data;
    const [imageData, offsetX, offsetY, ltX, ltY, scale, type] = data;
    const points = getPosition(imageData);

    // 取转换厘米后方块中心点
    const formatPoints = points.map((point) => [
      ltX + (point.x + offsetX) * scale + 50,
      ltY + (point.y + offsetY) * scale + 50,
    ]);
    postMessage({
      type: type,
      value: formatPoints,
    });
    this.self.close();
  },
  false,
);
