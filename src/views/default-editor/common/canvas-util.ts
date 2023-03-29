export function getPos(evt: MouseEvent): PointA {
  return { x: evt.offsetX, y: evt.offsetY };
}

export function getDistance(p1: PointA, p2: PointA): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

export function getPosKey(point: PointA): string {
  return point.x + '-' + point.y;
}

export function isPointOverlap(p1: PointA, p2: PointA): boolean {
  return p1.x - p2.x === 0 && p1.y - p2.y === 0;
}

// 是否是点
function _isPointInData(data: Uint8ClampedArray, startIndex: number) {
  return data[startIndex] || data[startIndex + 1] || data[startIndex + 2] || data[startIndex + 3];
}

// 获取数据中颜色为rgba的坐标
export function getPositionByRGBAColor(
  imageData: ImageData,
  rgba: [number, number, number, number],
) {
  const positions: number[][] = [];
  // imageData.data 大小为 height * width * 4，每4个值组成一个点，从左向右从上到下
  for (let yIndex = 0; yIndex < imageData.height; yIndex++) {
    for (let xIndex = 0; xIndex < imageData.width; xIndex++) {
      const pointStartIndex = xIndex * 4 + yIndex * 4 * imageData.width;
      if (
        [0, 1, 2].every(
          (index) => Math.abs(rgba[index] - imageData.data[pointStartIndex + index]) < 3,
        )
      ) {
        positions.push([xIndex, yIndex]);
      }
    }
  }
  return positions;
}

export function getPosition(imageData: ImageData) {
  const positions: number[][] = [];
  // imageData.data 大小为 height * width * 4，每4个值组成一个点，从左向右从上到下
  for (let yIndex = 0; yIndex < imageData.height; yIndex++) {
    for (let xIndex = 0; xIndex < imageData.width; xIndex++) {
      const pointStartIndex = xIndex * 4 + yIndex * 4 * imageData.width;
      if (_isPointInData(imageData.data, pointStartIndex)) {
        positions.push([xIndex, yIndex]);
      }
    }
  }
  return positions;
}

export function getConnectEndPoint(imageData: ImageData, point: PointA, lineWidth: number) {
  const endPoints: PointA[] = [];
  const data = imageData.data;
  const startX = point.x - 15 > 0 ? point.x - 15 : 0,
    startY = point.y - 15 > 0 ? point.y - 15 : 15,
    endX = point.x + 15,
    endY = point.y + 15;
  for (let yIndex = startY; yIndex <= endY; yIndex++) {
    for (let xIndex = startX; xIndex <= endX; xIndex++) {
      if (startX == xIndex || startY == yIndex) continue;
      const pointStartIndex = xIndex * 4 + yIndex * 4 * imageData.width;
      if (_isPointInData(imageData.data, pointStartIndex)) {
        // 查看九宫格内是否只有一个连接点(是否是端点)
        let connectPointCount = 0;
        // [x - 1, y -1]
        const leftTopStartIndex = pointStartIndex - 4 - 4 * imageData.width;
        leftTopStartIndex >= 0 &&
          leftTopStartIndex < data.length &&
          _isPointInData(data, leftTopStartIndex) &&
          ++connectPointCount;
        // [x - 1, y]
        const leftStartIndex = pointStartIndex - 4;
        leftStartIndex >= 0 &&
          leftStartIndex < data.length &&
          _isPointInData(data, leftStartIndex) &&
          ++connectPointCount;
        // [x - 1, y + 1]
        const leftBottomStartIndex = pointStartIndex - 4 + 4 * imageData.width;
        leftBottomStartIndex >= 0 &&
          leftBottomStartIndex < data.length &&
          _isPointInData(data, leftBottomStartIndex) &&
          ++connectPointCount;
        // [x, y - 1]
        const topStartIndex = pointStartIndex - 4 * imageData.width;
        topStartIndex >= 0 &&
          topStartIndex < data.length &&
          _isPointInData(data, topStartIndex) &&
          ++connectPointCount;
        // [x + 1, y - 1]
        const rightTopStartIndex = pointStartIndex + 4 - 4 * imageData.width;
        rightTopStartIndex >= 0 &&
          rightTopStartIndex < data.length &&
          _isPointInData(data, rightTopStartIndex) &&
          ++connectPointCount;
        // [x + 1, y]
        const rightStartIndex = pointStartIndex + 4;
        rightStartIndex >= 0 &&
          rightStartIndex < data.length &&
          _isPointInData(data, rightStartIndex) &&
          ++connectPointCount;
        // [x + 1, y + 1]
        const rightBottomStartIndex = pointStartIndex + 4 + 4 * imageData.width;
        rightBottomStartIndex >= 0 &&
          rightBottomStartIndex < data.length &&
          _isPointInData(data, rightBottomStartIndex) &&
          ++connectPointCount;
        // [x, y + 1]
        const bottomStartIndex = pointStartIndex + 4 * imageData.width;
        bottomStartIndex >= 0 &&
          bottomStartIndex < data.length &&
          _isPointInData(data, bottomStartIndex) &&
          ++connectPointCount;
        // canvas 在两个像素间绘制线时，由于无法绘制0.5px，1px直线会补全变为2px
        if (connectPointCount <= lineWidth + 2) {
          endPoints.push({ x: xIndex, y: yIndex });
        }
      }
    }
  }
  let minDistance = 30;
  let minDistancePoint = null;
  for (const endPoint of endPoints) {
    const distance = getDistance(endPoint, point);
    if (distance < minDistance && distance > 2) {
      minDistance = distance;
      minDistancePoint = endPoint;
    }
  }
  if (minDistancePoint != null) {
    return minDistancePoint;
  }
  return null;
}
