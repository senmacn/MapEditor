import { isPointInData } from '@/views/default-editor/utils/image-data-util';
import { isSameColor, setColorAtPixel, getColorAtPixel, colorToRGBA, ColorRGBA } from './colorUtils';

type PixelCoords = {
  x: number;
  y: number;
};

/**
 * [startX, endX, y, parentY]
 */
type LineQueued = [number, number, number, number];

export default class FloodFill {
  public imageData: ImageData;
  public isSameColor: typeof isSameColor;
  public setColorAtPixel: typeof setColorAtPixel;
  public getColorAtPixel: typeof getColorAtPixel;
  public colorToRGBA: typeof colorToRGBA;
  public collectModifiedPixels = false;
  public modifiedPixelsCount = 0;
  public modifiedPixels: Set<string> = new Set();

  private executeBounds: boolean;
  private _tolerance = 0;
  private _queue: Array<LineQueued> = [];
  private _replacedColor: ColorRGBA = { r: 255, g: 255, b: 255, a: 255 };
  private _newColor: ColorRGBA = { r: 255, g: 255, b: 255, a: 255 };

  constructor(imageData: ImageData, executeBounds: boolean = false) {
    this.imageData = imageData;
    // Allow for custom implementations of the following methods
    this.executeBounds = executeBounds;
    this.isSameColor = isSameColor;
    this.setColorAtPixel = setColorAtPixel;
    this.getColorAtPixel = getColorAtPixel;
    this.colorToRGBA = colorToRGBA;
  }
  /**
   * color should be in CSS format - rgba, rgb, or HEX
   */
  public fill(color: string, x: number, y: number, tolerance: number): void {
    this._newColor = this.colorToRGBA(color);
    this._replacedColor = this.getColorAtPixel(this.imageData, x, y);
    this._tolerance = tolerance;
    if (this.isSameColor(this._replacedColor, this._newColor, this._tolerance)) {
      return;
    }

    this.addToQueue([x, x, y, -1]);
    this.fillQueue();

    if (!this.executeBounds) {
      return;
    }
    // 去除无用点
    const data = this.imageData.data;
    for (let yIndex = 0; yIndex < this.imageData.height; yIndex++) {
      for (let xIndex = 0; xIndex < this.imageData.width; xIndex++) {
        const pointStartIndex = xIndex * 4 + yIndex * 4 * this.imageData.width;
        if (
          data[pointStartIndex] !== this._newColor.r ||
          data[pointStartIndex + 1] !== this._newColor.g ||
          data[pointStartIndex + 2] !== this._newColor.b ||
          data[pointStartIndex + 3] !== this._newColor.a
        ) {
          data[pointStartIndex] = 0;
          data[pointStartIndex + 1] = 0;
          data[pointStartIndex + 2] = 0;
          data[pointStartIndex + 3] = 0;
        }
      }
    }
  }

  /**
   * 混合原有的imageData和新imageData，更新边界
   * @param initialData
   * @returns
   */
  public getImageDataFrom(initialData: ImageData) {
    const data = initialData.data;
    const newData = this.imageData.data;
    let minX = this.imageData.height;
    let minY = this.imageData.width;
    let maxX = 0;
    let maxY = 0;
    for (let yIndex = 0; yIndex < this.imageData.height; yIndex++) {
      for (let xIndex = 0; xIndex < this.imageData.width; xIndex++) {
        const pointStartIndex = xIndex * 4 + yIndex * 4 * this.imageData.width;
        // 去除无用点（原来有点，新data没点）
        if (isPointInData(data, pointStartIndex) && !isPointInData(newData, pointStartIndex)) {
          data[pointStartIndex] = 0;
          data[pointStartIndex + 1] = 0;
          data[pointStartIndex + 2] = 0;
          data[pointStartIndex + 3] = 0;
        }
        // 更新边界，二者都有点
        if (isPointInData(data, pointStartIndex) && isPointInData(newData, pointStartIndex)) {
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
        }
      }
    }
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d') as CanvasRenderingContext2D;
    tempCanvas.width = this.imageData.width;
    tempCanvas.height = this.imageData.height;
    tempContext.putImageData(initialData, 0, 0);
    return [
      tempContext.getImageData(minX, minY, maxX - minX + 1, maxY - minY + 1),
      [minX, minY, maxX - minX + 1, maxY - minY + 1],
    ];
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

  private isValidPoint(pixel: PixelCoords | null): boolean {
    if (pixel === null) {
      return false;
    }
    const pixelColor = this.getColorAtPixel(this.imageData, pixel.x, pixel.y);
    return Object.values(pixelColor).some((c) => c);
  }

  private fillLineAtAll(x: number, y: number): [number, number] {
    if (!this.isValidTarget({ x, y })) {
      // 向左看边界
      let left = this.getPixelNeighbor('left', x, y);
      while (left && this.isValidPoint(left)) {
        this.setPixelColor(this._newColor, left);
        left = this.getPixelNeighbor('left', left.x, y);
      }
      // 向右看边界
      let right = this.getPixelNeighbor('right', x, y);
      while (right && this.isValidPoint(right)) {
        this.setPixelColor(this._newColor, right);
        right = this.getPixelNeighbor('right', right.x, y);
      }
      // 向上看边界
      let top = this.getPixelNeighbor('top', x, y);
      while (top && this.isValidPoint(top)) {
        this.setPixelColor(this._newColor, top);
        top = this.getPixelNeighbor('top', x, top.y);
      }
      // 向下看边界
      let bottom = this.getPixelNeighbor('bottom', x, y);
      while (bottom && this.isValidPoint(bottom)) {
        this.setPixelColor(this._newColor, bottom);
        bottom = this.getPixelNeighbor('bottom', x, bottom.y);
      }
      return [-1, -1];
    }

    this.setPixelColor(this._newColor, { x, y });
    let minX = x;
    let maxX = x;
    let px = this.getPixelNeighbor('left', minX, y);
    while (px && this.isValidTarget(px)) {
      this.setPixelColor(this._newColor, px);
      minX = px.x;
      px = this.getPixelNeighbor('left', minX, y);
    }
    // 向左看边界
    let left = this.getPixelNeighbor('left', minX, y);
    while (left && this.isValidPoint(left)) {
      this.setPixelColor(this._newColor, left);
      left = this.getPixelNeighbor('left', left.x, y);
    }

    px = this.getPixelNeighbor('right', maxX, y);
    while (px && this.isValidTarget(px)) {
      this.setPixelColor(this._newColor, px);
      maxX = px.x;
      px = this.getPixelNeighbor('right', maxX, y);
    }
    // 向右看边界
    let right = this.getPixelNeighbor('right', minX, y);
    while (right && this.isValidPoint(right)) {
      this.setPixelColor(this._newColor, right);
      right = this.getPixelNeighbor('right', right.x, y);
    }

    return [minX, maxX];
  }

  private fillLineAt(x: number, y: number): [number, number] {
    if (!this.isValidTarget({ x, y })) {
      return [-1, -1];
    }
    this.setPixelColor(this._newColor, { x, y });
    let minX = x;
    let maxX = x;
    let px = this.getPixelNeighbor('left', minX, y);
    while (px && this.isValidTarget(px)) {
      this.setPixelColor(this._newColor, px);
      minX = px.x;
      px = this.getPixelNeighbor('left', minX, y);
    }
    px = this.getPixelNeighbor('right', maxX, y);
    while (px && this.isValidTarget(px)) {
      this.setPixelColor(this._newColor, px);
      maxX = px.x;
      px = this.getPixelNeighbor('right', maxX, y);
    }
    return [minX, maxX];
  }

  private fillQueue(): void {
    let line = this.popFromQueue();
    while (line) {
      const [start, end, y, parentY] = line;
      let currX = start;
      while (currX !== -1 && currX <= end) {
        const [lineStart, lineEnd] = this.executeBounds ? this.fillLineAtAll(currX, y) : this.fillLineAt(currX, y);
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

  private setPixelColor(color: ColorRGBA, pixel: PixelCoords): void {
    this.setColorAtPixel(this.imageData, color, pixel.x, pixel.y);
    this.modifiedPixelsCount++;
    this.collectModifiedPixels && this.modifiedPixels.add(`${pixel.x}|${pixel.y}`);
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
        coords = { x: x | 0, y: y + 1 };
        break;
      case 'bottom':
        coords = { x: x | 0, y: y - 1 };
        break;
    }
    if (coords.x >= 0 && coords.x < this.imageData.width && coords.y >= 0 && coords.y < this.imageData.height) {
      return coords;
    }
    return null;
  }
}
