import {
  isSameColor,
  setColorAtPixel,
  getColorAtPixel,
  colorToRGBA,
  ColorRGBA,
} from './colorUtils';

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

  private isScale: boolean;
  private _tolerance = 0;
  private _queue: Array<LineQueued> = [];
  private _replacedColor: ColorRGBA = { r: 255, g: 255, b: 255, a: 255 };
  private _newColor: ColorRGBA = { r: 255, g: 255, b: 255, a: 255 };

  constructor(imageData: ImageData, isScale: boolean = false) {
    this.imageData = imageData;
    this.isScale = isScale;
    // Allow for custom implementations of the following methods
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
    if (this.isSameColor(this._replacedColor, this._newColor, this._tolerance, this.isScale)) {
      return;
    }

    this.addToQueue([x, x, y, -1]);
    this.fillQueue();
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
    return this.isSameColor(this._replacedColor, pixelColor, this._tolerance, this.isScale);
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
        const [lineStart, lineEnd] = this.fillLineAt(currX, y);
        if (lineStart !== -1) {
          if (y > 0) {
            this.addToQueue([lineStart, lineEnd, y - 1, y]);
          }
          if (y + 1 < this.imageData.height) {
            this.addToQueue([lineStart, lineEnd, y + 1, y]);
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

  private getPixelNeighbor(direction: 'left' | 'right', x: number, y: number): PixelCoords | null {
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
    }
    if (coords.x >= 0 && coords.x < this.imageData.width) {
      return coords;
    }
    return null;
  }
}
