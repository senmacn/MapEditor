export function getPos(evt: MouseEvent): PointA {
  return { x: evt.offsetX, y: evt.offsetY };
}

export function getDistance(p1: PointA, p2: PointA): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

export function getDistance2(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}

// 获取点的key 'x-y'
export function getPosKey(point: PointA): string {
  return point.x + '-' + point.y;
}

// 两点是否重合
export function isPointOverlap(p1: PointA, p2: PointA): boolean {
  return p1.x - p2.x === 0 && p1.y - p2.y === 0;
}

export function getZoomChangeStyle(zoom: number, width, height) {
  return {
    transform: 'scale(' + zoom + ')',
    left: (width * (zoom - 1)) / 2 + 'px',
    top: (height * (zoom - 1)) / 2 + 'px',
  };
}
