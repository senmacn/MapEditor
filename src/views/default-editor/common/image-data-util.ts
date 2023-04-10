import { getDistance } from './canvas-util';

// 是否是点
export function isPointInData(data: Uint8ClampedArray, startIndex: number) {
  return data[startIndex] || data[startIndex + 1] || data[startIndex + 2] || data[startIndex + 3];
}

// 获取数据中颜色为rgba的坐标
// export function getPositionByRGBAColor(
//   imageData: ImageData,
//   rgba: [number, number, number, number],
// ) {
//   const positions: number[][] = [];
//   // imageData.data 大小为 height * width * 4，每4个值组成一个点，从左向右从上到下
//   for (let yIndex = 0; yIndex < imageData.height; yIndex++) {
//     for (let xIndex = 0; xIndex < imageData.width; xIndex++) {
//       const pointStartIndex = xIndex * 4 + yIndex * 4 * imageData.width;
//       if (
//         [0, 1, 2].every(
//           (index) => Math.abs(rgba[index] - imageData.data[pointStartIndex + index]) <= 1,
//         )
//       ) {
//         positions.push([xIndex, yIndex]);
//       }
//     }
//   }
//   return positions;
// }

export function getPosition(imageData: ImageData) {
  const positions: Point[] = [];
  // imageData.data 大小为 height * width * 4，每4个值组成一个点，从左向右从上到下
  for (let yIndex = 0; yIndex < imageData.height; yIndex++) {
    for (let xIndex = 0; xIndex < imageData.width; xIndex++) {
      const pointStartIndex = xIndex * 4 + yIndex * 4 * imageData.width;
      if (isPointInData(imageData.data, pointStartIndex)) {
        positions.push([xIndex, yIndex]);
      }
    }
  }
  return positions;
}

// 获取范围内点的数量
export function getPositionCount(imageData: ImageData, x, y, width, height): number {
  let count = 0;
  // imageData.data 大小为 height * width * 4，每4个值组成一个点，从左向右从上到下
  for (let yIndex = y; yIndex < y + height; yIndex++) {
    for (let xIndex = x; xIndex < x + width; xIndex++) {
      const pointStartIndex = xIndex * 4 + yIndex * 4 * imageData.width;
      if (isPointInData(imageData.data, pointStartIndex)) {
        count++;
      }
    }
  }
  return count;
}

/**
 * 获取可以自动连接的端点（根据线段宽度，判断的范围不同）
 * @param imageData 画布信息
 * @param point 点
 * @param lineWidth 线段宽度
 * @returns
 */
export function getConnectEndPoint(imageData: ImageData, point: PointA, lineWidth: number) {
  const endPoints: PointA[] = [];
  const data = imageData.data;
  const checkLength = Math.floor(15 + lineWidth / 2);
  const startX = point.x - checkLength > 0 ? point.x - checkLength : 0,
    startY = point.y - checkLength > 0 ? point.y - checkLength : checkLength,
    endX = point.x + checkLength,
    endY = point.y + checkLength;
  for (let yIndex = startY; yIndex <= endY; yIndex++) {
    for (let xIndex = startX; xIndex <= endX; xIndex++) {
      if (startX == xIndex || startY == yIndex) continue;
      const pointStartIndex = xIndex * 4 + yIndex * 4 * imageData.width;
      if (isPointInData(imageData.data, pointStartIndex)) {
        // 查看九宫格内是否只有X个连接点(是否是端点)
        let connectPointCount = 0;
        // [x - 1, y -1]
        const leftTopStartIndex = pointStartIndex - 4 - 4 * imageData.width;
        leftTopStartIndex >= 0 &&
          leftTopStartIndex < data.length &&
          isPointInData(data, leftTopStartIndex) &&
          ++connectPointCount;
        // [x - 1, y]
        const leftStartIndex = pointStartIndex - 4;
        leftStartIndex >= 0 &&
          leftStartIndex < data.length &&
          isPointInData(data, leftStartIndex) &&
          ++connectPointCount;
        // [x - 1, y + 1]
        const leftBottomStartIndex = pointStartIndex - 4 + 4 * imageData.width;
        leftBottomStartIndex >= 0 &&
          leftBottomStartIndex < data.length &&
          isPointInData(data, leftBottomStartIndex) &&
          ++connectPointCount;
        // [x, y - 1]
        const topStartIndex = pointStartIndex - 4 * imageData.width;
        topStartIndex >= 0 &&
          topStartIndex < data.length &&
          isPointInData(data, topStartIndex) &&
          ++connectPointCount;
        // [x + 1, y - 1]
        const rightTopStartIndex = pointStartIndex + 4 - 4 * imageData.width;
        rightTopStartIndex >= 0 &&
          rightTopStartIndex < data.length &&
          isPointInData(data, rightTopStartIndex) &&
          ++connectPointCount;
        // [x + 1, y]
        const rightStartIndex = pointStartIndex + 4;
        rightStartIndex >= 0 &&
          rightStartIndex < data.length &&
          isPointInData(data, rightStartIndex) &&
          ++connectPointCount;
        // [x + 1, y + 1]
        const rightBottomStartIndex = pointStartIndex + 4 + 4 * imageData.width;
        rightBottomStartIndex >= 0 &&
          rightBottomStartIndex < data.length &&
          isPointInData(data, rightBottomStartIndex) &&
          ++connectPointCount;
        // [x, y + 1]
        const bottomStartIndex = pointStartIndex + 4 * imageData.width;
        bottomStartIndex >= 0 &&
          bottomStartIndex < data.length &&
          isPointInData(data, bottomStartIndex) &&
          ++connectPointCount;
        // canvas 在两个像素间绘制线时，由于无法绘制0.5px，1px直线会补全变为2px
        if (connectPointCount <= lineWidth + 2) {
          endPoints.push({ x: xIndex, y: yIndex });
        }
      }
    }
  }
  let minDistance = 30;
  let minDistancePoint: PointA | null = null;
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

// 获取矩形轮廓
export function getImageDataBoundRect(imageData: ImageData): Box {
  let minX = imageData.height;
  let minY = imageData.width;
  let maxX = 0;
  let maxY = 0;
  let flag = false;
  for (let yIndex = 0; yIndex < imageData.height; yIndex++) {
    for (let xIndex = 0; xIndex < imageData.width; xIndex++) {
      const pointStartIndex = xIndex * 4 + yIndex * 4 * imageData.width;
      if (isPointInData(imageData.data, pointStartIndex)) {
        if (xIndex < minX) {
          minX = xIndex;
        }
        if (yIndex < minY) {
          minY = yIndex;
        }
        if (xIndex > maxX) {
          maxX = xIndex;
        }
        if (yIndex > maxY) {
          maxY = yIndex;
        }
        flag = true;
      }
    }
  }
  return flag ? [minX, minY, maxX - minX, maxY - minY] : [0, 0, 0, 0];
}

// 获取封闭曲线
function getClosedCurvePoints(points) {
  let intersectPArray: Recordable[] = [];
  var isLine = true;
  for (var i = 0; i < points.length; i++) {
    let p = points[i];
    for (var j = points.length - 1; j >= 0; j--) {
      if (j - i < points.length / 2) continue;
      let eP = points[j];
      let xDis = p.x - eP.x;
      let yDis = p.y - eP.y;
      let dis = Math.sqrt(Math.pow(xDis, 2) + Math.pow(yDis, 2));

      if (Math.abs(xDis) >= 20 && Math.abs(yDis) >= 20) {
        isLine = false;
      }

      if (dis <= 10) {
        //dis=0才是真正有交叉点的情况,但是用户不一定每次都能画出完美存在交叉点的圈 这种情况下应给予一个合理的误差值
        intersectPArray.push({
          p: p,
          dis: dis,
          leftIdx: i,
          rightIdx: j,
        });
      }
    }
  }

  if (isLine) {
    console.log('绘制的是直线');
    return null;
  }
  if (intersectPArray.length == 0) {
    console.log('不存在交叉点');
    return null;
  }

  intersectPArray.sort((a, b) => {
    return a.dis - b.dis;
  });
  let intersectP = intersectPArray[0];
  if (intersectP.leftIdx < intersectP.rightIdx) {
    return points.slice(intersectP.leftIdx, intersectP.rightIdx + 1);
  } else {
    return points.slice(intersectP.rightIdx, intersectP.leftIdx + 1);
  }
}
