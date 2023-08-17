import { Area } from '../draw-element';
import { getDistance } from './canvas-util';
import FloodFill from '@/utils/q-floodfill';

// 是否是点
export function isPointInData(data: Uint8ClampedArray, startIndex: number) {
  return (
    data[startIndex] > 0 ||
    data[startIndex + 1] > 0 ||
    data[startIndex + 2] > 0 ||
    data[startIndex + 3] > 0
  );
}

// 获取范围内点的数量
export function getPositionCount(imageData: ImageData, x, y, width, height): number {
  let count = 0;
  // imageData.data 大小为 height * width * 4，每4个值组成一个点，从左向右从上到下
  for (let yIndex = y; yIndex < y + height; yIndex++) {
    for (let xIndex = x; xIndex < x + width; xIndex++) {
      if (yIndex >= 0 && xIndex >= 0 && xIndex < imageData.width && yIndex < imageData.height) {
        const pointStartIndex = xIndex * 4 + yIndex * 4 * imageData.width;
        if (isPointInData(imageData.data, pointStartIndex)) {
          count++;
        }
      }
    }
  }
  return count;
}

/**
 * 获取可以自动连接的端点（根据线段宽度，判断的范围不同）
 * @param imageData 画布信息(部分)
 * @param point 点
 * @param lineWidth 线段宽度
 * @returns
 */
export function getConnectEndPoint(
  imageData: ImageData,
  point: PointA,
  lineWidth: number,
  scope: number,
) {
  const endPoints: PointA[] = [];
  const data = imageData.data;
  const checkLength = Math.floor(scope / 2 + lineWidth / 2);
  const startX = point.x - checkLength > 0 ? point.x - checkLength : 0,
    startY = point.y - checkLength > 0 ? point.y - checkLength : 0,
    endX = point.x + checkLength,
    endY = point.y + checkLength;
  for (let yIndex = startY; yIndex <= endY; yIndex++) {
    for (let xIndex = startX; xIndex <= endX; xIndex++) {
      if (point.x == xIndex || point.y == yIndex) continue;
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
  let minDistance = scope;
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

// 拷贝imageData
export function copyImageData(imageData: ImageData) {
  return new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
}

/**
 * 获取缩放计算后的imagedata（性能较差）
 * @param imageData 原data
 * @param scale 缩放比例
 * @returns 新data
 */
export function scaleImageData(imageData, scale) {
  const dataW = imageData.width;
  const dataH = imageData.height;
  const w = Math.floor(imageData.width * scale);
  const h = Math.floor(imageData.height * scale);

  const offscreenCanvas = new OffscreenCanvas(imageData.width, imageData.height);
  const context = <OffscreenCanvasRenderingContext2D>offscreenCanvas.getContext('2d', {
    willReadFrequently: true,
  });
  context.putImageData(imageData, 0, 0);

  const tempCanvas = document.createElement('canvas');
  const tempContext = tempCanvas.getContext('2d') as CanvasRenderingContext2D;
  tempCanvas.width = w;
  tempCanvas.height = h;
  tempContext.drawImage(offscreenCanvas, 0, 0, dataW, dataH, 0, 0, w, h);

  return tempContext.getImageData(0, 0, w, h);
}

// 获取矩形轮廓
// TODO: 在画的过程中计算 xmin ymin xmax ymax
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
  // +1 否则会少一个点
  return flag ? [minX, minY, maxX - minX + 1, maxY - minY + 1] : [0, 0, 0, 0];
}

// 获取imageData中的点
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

/**
 * 获取描完封闭曲线内部的点后的imageData
 * @param area 封闭区域
 * @returns 包含内部点的imagedata
 */
export function getClosedCurvePointsData(area: Area, colors = [255, 0, 0, 255]) {
  // FloodFill fill 会修改原数据，拷贝一份新的
  const imageData = copyImageData(area.getData());
  const floodFill = new FloodFill(imageData);
  const point = area.getChoosePoint();

  if (point) {
    floodFill.fill(`rgb(${colors.join(',')})`, point[0], point[1], 0);
  } else {
    const points = area.getBoundRectPoints();
    const rect = area.getActualBoundRect();
    floodFill.fill(`rgb(${colors.join(',')})`, points[0][0] + rect[0], points[0][1] + rect[1], 0);
  }

  // put the modified data back in context
  return floodFill.imageData;
}
