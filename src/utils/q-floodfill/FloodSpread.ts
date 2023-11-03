/**
 * 基于 q-floodfill 实现获取区域边界最外层
 */

import type { ColorRGBA } from './colorUtils';
import { isSameColor, getColorAtPixel, setColorAtPixel } from './colorUtils';

type PixelCoords = {
  x: number;
  y: number;
};

/**
 * [startX, endX, y, parentY] or [startY, endY, x, parentX]
 */
type LineQueued = [number, number, number, number];

export default class FloodSpread {
  public imageData: ImageData;
  public yImageData: ImageData;
  public isSameColor: typeof isSameColor;
  public setColorAtPixel: typeof setColorAtPixel;
  public getColorAtPixel: typeof getColorAtPixel;

  private _tolerance = 0;
  private _queue: Array<LineQueued> = [];
  private _replacedColor: ColorRGBA = { r: 0, g: 0, b: 0, a: 0 };
  private _newColor: ColorRGBA = { r: 255, g: 255, b: 255, a: 111 };
  private results: [number, number][] = [];

  constructor(imageData: ImageData) {
    this.imageData = imageData;
    this.yImageData = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);

    this.isSameColor = isSameColor;
    this.setColorAtPixel = setColorAtPixel;
    this.getColorAtPixel = getColorAtPixel;
  }

  public getResults() {
    return this.results;
  }

  public spread(x: number, y: number, tolerance: number): void {
    this._replacedColor = this.getColorAtPixel(this.imageData, x, y);
    this._tolerance = tolerance;

    this.addToQueue([x, x, y, -1]);
    this.spreadQueueX();
    // 替换一下
    this.imageData = this.yImageData;
    this.addToQueue([y, y, x, -1]);
    this.spreadQueueY();
  }

  private addToQueue(line: LineQueued): void {
    this._queue.push(line);
  }

  private popFromQueue(): LineQueued | null {
    if (!this._queue.length) {
      return null;
    }
    return this._queue.pop() as LineQueued | null;
  }

  private isValidTarget(pixel: PixelCoords | null): boolean {
    if (pixel === null) {
      return false;
    }
    const pixelColor = this.getColorAtPixel(this.imageData, pixel.x, pixel.y);
    return this.isSameColor(this._replacedColor, pixelColor, this._tolerance);
  }

  private isValidBorder(pixel: PixelCoords | null): boolean {
    if (pixel === null) {
      return false;
    }
    const pixelColor = this.getColorAtPixel(this.imageData, pixel.x, pixel.y);
    return !this.isSameColor(this._replacedColor, pixelColor) && !this.isSameColor(this._newColor, pixelColor);
  }

  // 扩张基点（先左右再扩张基点，否则先扩张完基点，左右有问题）
  private spreadPoint(x: number, y: number) {
    if (this.isValidTarget({ x, y })) {
      this.setPixelColor(this._newColor, { x, y });
    }
  }

  // 向左扩张
  private spreadLineLeft(x: number, y: number): number {
    if (this.isValidBorder({ x, y })) {
      return -1;
    }
    let minX = x;
    let px = this.getPixelNeighbor('left', minX, y);
    while (px) {
      // 如果是内部点，则继续移动
      if (this.isValidTarget(px)) {
        this.setPixelColor(this._newColor, px);
        minX = px.x;
        px = this.getPixelNeighbor('left', minX, y);
      } else {
        // 如果不是内部点，判断是否是边界
        while (px && this.isValidBorder(px)) {
          const newPx = this.getPixelNeighbor('left', px.x, y);
          // 如果边界点的下一个点是外部点（非边界），则找到了最外层边界
          if (this.isValidBorder(newPx)) {
            px = newPx;
            continue;
          } else {
            this.results.push([px.x, y]);
            break;
          }
        }
        break;
      }
    }

    return minX;
  }

  // 向右扩张
  private spreadLineRight(x: number, y: number): number {
    if (this.isValidBorder({ x, y })) {
      return -1;
    }
    let maxX = x;
    let px = this.getPixelNeighbor('right', maxX, y);
    while (px) {
      // 如果是内部点，则继续移动
      if (this.isValidTarget(px)) {
        this.setPixelColor(this._newColor, px);
        maxX = px.x;
        px = this.getPixelNeighbor('right', maxX, y);
      } else {
        // 如果不是内部点，判断是否是边界
        while (px && this.isValidBorder(px)) {
          const newPx = this.getPixelNeighbor('right', px.x, y);
          // 如果边界点的下一个点是外部点（非边界），则找到了最外层边界
          if (this.isValidBorder(newPx)) {
            px = newPx;
            continue;
          } else {
            this.results.push([px.x, y]);
            break;
          }
        }
        break;
      }
    }
    return maxX;
  }

  // 向上扩张
  private spreadLineTop(x: number, y: number): number {
    if (this.isValidBorder({ x, y })) {
      return -1;
    }
    let minY = y;
    let px = this.getPixelNeighbor('top', x, minY);
    while (px) {
      // 如果是内部点，则继续移动
      if (this.isValidTarget(px)) {
        this.setPixelColor(this._newColor, px);
        minY = px.y;
        px = this.getPixelNeighbor('top', x, minY);
      } else {
        // 如果不是内部点，判断是否是边界
        while (px && this.isValidBorder(px)) {
          const newPx = this.getPixelNeighbor('top', x, px.y);
          // 如果边界点的下一个点是外部点（非边界），则找到了最外层边界
          if (this.isValidBorder(newPx)) {
            px = newPx;
            continue;
          } else {
            this.results.push([x, px.y]);
            break;
          }
        }
        break;
      }
    }
    return minY;
  }

  // 向下扩张
  private spreadLineBottom(x: number, y: number): number {
    if (this.isValidBorder({ x, y })) {
      return -1;
    }
    let maxY = y;
    let px = this.getPixelNeighbor('bottom', x, maxY);
    while (px) {
      // 如果是内部点，则继续移动
      if (this.isValidTarget(px)) {
        this.setPixelColor(this._newColor, px);
        maxY = px.y;
        px = this.getPixelNeighbor('bottom', x, maxY);
      } else {
        // 如果不是内部点，判断是否是边界
        while (px && this.isValidBorder(px)) {
          const newPx = this.getPixelNeighbor('bottom', x, px.y);
          // 如果边界点的下一个点是外部点（非边界），则找到了最外层边界
          if (this.isValidBorder(newPx)) {
            px = newPx;
            continue;
          } else {
            this.results.push([x, px.y]);
            break;
          }
        }
        break;
      }
    }
    return maxY;
  }

  private spreadQueueX(): void {
    let line = this.popFromQueue();
    while (line) {
      const [start, end, y, parentY] = line;
      let currX = start;
      while (currX !== -1 && currX <= end) {
        const lineStart = this.spreadLineLeft(currX, y);
        const lineEnd = this.spreadLineRight(currX, y);
        this.spreadPoint(currX, y);

        if (lineStart !== -1) {
          if (lineStart >= start && lineEnd <= end && parentY !== -1) {
            if (parentY < y && y + 1 < this.imageData.height) {
              this.addToQueue([lineStart, lineEnd, y + 1, y]);
            }
            if (parentY > y && y > 0) {
              this.addToQueue([lineStart, lineEnd, y - 1, y]);
            }
          } else {
            if (y > 0) {
              this.addToQueue([lineStart, lineEnd, y - 1, y]);
            }
            if (y + 1 < this.imageData.height) {
              this.addToQueue([lineStart, lineEnd, y + 1, y]);
            }
          }
        }
        if (lineEnd === -1 && currX <= end) {
          currX += 1;
        } else {
          currX = lineEnd + 1;
        }
      }
      line = this.popFromQueue();
    }
  }

  private spreadQueueY(): void {
    let line = this.popFromQueue();
    while (line) {
      const [start, end, x, parentX] = line;
      let currY = start;
      while (currY !== -1 && currY <= end) {
        const lineStart = this.spreadLineTop(x, currY);
        const lineEnd = this.spreadLineBottom(x, currY);
        this.spreadPoint(x, currY);

        if (lineStart !== -1) {
          if (lineStart >= start && lineEnd <= end && parentX !== -1) {
            if (parentX < x && x + 1 < this.imageData.width) {
              this.addToQueue([lineStart, lineEnd, x + 1, x]);
            }
            if (parentX > x && x > 0) {
              this.addToQueue([lineStart, lineEnd, x - 1, x]);
            }
          } else {
            if (x > 0) {
              this.addToQueue([lineStart, lineEnd, x - 1, x]);
            }
            if (x + 1 < this.imageData.width) {
              this.addToQueue([lineStart, lineEnd, x + 1, x]);
            }
          }
        }
        if (lineEnd === -1 && currY <= end) {
          currY += 1;
        } else {
          currY = lineEnd + 1;
        }
      }
      line = this.popFromQueue();
    }
  }

  private setPixelColor(color: ColorRGBA, pixel: PixelCoords): void {
    this.setColorAtPixel(this.imageData, color, pixel.x, pixel.y);
  }

  private getPixelNeighbor(direction: 'left' | 'right' | 'top' | 'bottom', x: number, y: number): PixelCoords | null {
    x = x | 0;
    y = y | 0;
    let coords: PixelCoords;
    switch (direction) {
      case 'right':
        coords = { x: (x + 1) | 0, y };
        break;
      case 'left':
        coords = { x: (x - 1) | 0, y };
        break;
      case 'top':
        coords = { x: x | 0, y: y - 1 };
        break;
      case 'bottom':
        coords = { x: x | 0, y: y + 1 };
        break;
    }
    if (coords.x >= 0 && coords.x < this.imageData.width && coords.y >= 0 && coords.y < this.imageData.height) {
      return coords;
    }
    return null;
  }
}
