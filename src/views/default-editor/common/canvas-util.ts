export function getPos(evt: MouseEvent): PointA {
  return { x: evt.offsetX, y: evt.offsetY };
}

export function getDistance(p1: PointA, p2: PointA): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// 获取点的key 'x-y'
export function getPosKey(point: PointA): string {
  return point.x + '-' + point.y;
}

// 两点是否重合
export function isPointOverlap(p1: PointA, p2: PointA): boolean {
  return p1.x - p2.x === 0 && p1.y - p2.y === 0;
}

// TODO: 1000 换成width
export function getZoomChangeStyle(zoom: number) {
  return {
    transform: 'scale(' + zoom + ')',
    left: 500 * (zoom - 1) + 'px',
    top: 500 * (zoom - 1) + 'px',
  };
}

export function transformToOffset(rect: Box, fromOffset: Offset, toOffset: Offset): Box {
  const x = rect[0] - toOffset.x + fromOffset.x;
  const y = rect[1] - toOffset.y + fromOffset.y;
  return [x, y, rect[2], rect[3]];
}

