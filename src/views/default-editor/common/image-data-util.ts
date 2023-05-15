import { Area } from './area';
import { getDistance } from './canvas-util';

// 是否是点
export function isPointInData(data: Uint8ClampedArray, startIndex: number) {
  return data[startIndex] || data[startIndex + 1] || data[startIndex + 2] || data[startIndex + 3];
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
export function copyImageData(imageData) {
  return new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
}

/**
 * 混入区域（只混入有数据的部分）
 * @param imageData 原imageData
 * @param area 新imageData
 * @returns 新imageData
 */
export function mixinData(imageData: ImageData, points: Point[]) {
  const newData = copyImageData(imageData);
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const pointStartIndex = (point[0] + point[1] * imageData.width) * 4;
    newData.data[pointStartIndex] = 255;
    newData.data[pointStartIndex + 1] = 0;
    newData.data[pointStartIndex + 2] = 0;
    newData.data[pointStartIndex + 3] = 255;
  }
  return newData;
}

/**
 * 获取缩放计算后的imagedata
 * @param imageData 原data
 * @param scale 缩放比例
 * @returns 新data
 */
export function scaleImageData(imageData: ImageData, scale: number) {
  var scaled = new ImageData(
    Math.floor(imageData.width * scale),
    Math.floor(imageData.height * scale),
  );
  for (var row = 0; row < imageData.height; row++) {
    for (var col = 0; col < imageData.width; col++) {
      var sourcePixel = [
        imageData.data[(row * imageData.width + col) * 4 + 0],
        imageData.data[(row * imageData.width + col) * 4 + 1],
        imageData.data[(row * imageData.width + col) * 4 + 2],
        imageData.data[(row * imageData.width + col) * 4 + 3],
      ];
      // 防止scale小于1时跳过某些值
      const _scale = scale >= 1 ? 1 : 1;
      for (var y = 0; y < _scale; y++) {
        var destRow = Math.floor(row * scale) + y;
        for (var x = 0; x < _scale; x++) {
          var destCol = Math.floor(col * scale) + x;
          for (var i = 0; i < 4; i++) {
            // 防止放缩的时候，有值的点被后续压进来的无值点覆盖
            if (!scaled.data[(destRow * scaled.width + destCol) * 4 + i]) {
              scaled.data[(destRow * scaled.width + destCol) * 4 + i] = sourcePixel[i];
            }
          }
        }
      }
    }
  }
  return scaled;
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
export function getClosedCurvePointsData(area: Area) {
  const rect = area.getBoundRect();
  const imageData = area.getData();
  const newImageData = new ImageData(rect[2], rect[3]);
  const boundPoints = getPosition(imageData);
  for (let yIndex = 0; yIndex < rect[3]; yIndex++) {
    for (let xIndex = 0; xIndex < rect[2]; xIndex++) {
      const pointStartIndex = xIndex * 4 + yIndex * 4 * imageData.width;
      // 是点的话直接加入（加上偏移量）
      if (boundPoints.some((point) => point[0] === xIndex && point[1] === yIndex)) {
        newImageData.data[pointStartIndex] = 1;
      } else {
        // 跳过边界上的
        if (xIndex === 0 || xIndex === rect[2] - 1 || yIndex === 0 || yIndex === rect[3] - 1) {
          continue;
        } else {
          if (isPointInPolygon([xIndex, yIndex], boundPoints)) {
            // 描点
            newImageData.data[pointStartIndex] = 1;
          }
        }
      }
    }
  }
  return newImageData;
}

function isPointInPolygon(point: Point, pts: Point[]) {
  //下述代码来源：http://paulbourke.net/geometry/insidepoly/，进行了部分修改
  //基本思想是利用射线法，计算射线与多边形各边的交点，如果是偶数，则点在多边形外，否则
  //在多边形内。还会考虑一些特殊情况，如点在多边形顶点上，点在多边形边上等特殊情况。
  var N = pts.length;
  var boundOrVertex = true; //如果点位于多边形的顶点或边上，也算做点在多边形内，直接返回true
  var intersectCount = 0; //cross points count of x
  var precision = 2e-10; //浮点类型计算时候与0比较时候的容差
  var p1, p2; //neighbour bound vertices
  var p = point; //测试点

  p1 = pts[0]; //left vertex
  for (var i = 1; i <= N; ++i) {
    //check all rays
    if (p[0] === p1[0] && p[1] === p1[1]) {
      return boundOrVertex; //p is an vertex
    }

    p2 = pts[i % N]; //right vertex
    if (p[0] < Math.min(p1[0], p2[0]) || p[0] > Math.max(p1[0], p2[0])) {
      //ray is outside of our interests
      p1 = p2;
      continue; //next ray left point
    }

    if (p[0] > Math.min(p1[0], p2[0]) && p[0] < Math.max(p1[0], p2[0])) {
      //ray is crossing over by the algorithm (common part of)
      if (p[1] <= Math.max(p1[1], p2[1])) {
        //x is before of ray
        if (p1[0] == p2[0] && p[1] >= Math.min(p1[1], p2[1])) {
          //overlies on a horizontal ray
          return boundOrVertex;
        }

        if (p1[1] == p2[1]) {
          //ray is vertical
          if (p1[1] == p[1]) {
            //overlies on a vertical ray
            return boundOrVertex;
          } else {
            //before ray
            ++intersectCount;
          }
        } else {
          //cross point on the left side
          var xinters = ((p[0] - p1[0]) * (p2[1] - p1[1])) / (p2[0] - p1[0]) + p1[1]; //cross point of lng
          if (Math.abs(p[1] - xinters) < precision) {
            //overlies on a ray
            return boundOrVertex;
          }

          if (p[1] < xinters) {
            //before ray
            ++intersectCount;
          }
        }
      }
    } else {
      //special case when ray is crossing through the vertex
      if (p[0] == p2[0] && p[1] <= p2[1]) {
        //p crossing over p2
        var p3 = pts[(i + 1) % N]; //next vertex
        if (p[0] >= Math.min(p1[0], p3[0]) && p[0] <= Math.max(p1[0], p3[0])) {
          //p[0] lies between p1[0] & p3[0]
          ++intersectCount;
        } else {
          intersectCount += 2;
        }
      }
    }
    p1 = p2; //next ray left point
  }

  if (intersectCount % 2 == 0) {
    //偶数在多边形外
    return false;
  } else {
    //奇数在多边形内
    return true;
  }
}
