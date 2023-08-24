import { message } from 'ant-design-vue';
import { CanvasExtendImp } from '../common/types';
import { useEditorConfig } from '@/store/modules/editor-config';
import { isNull } from '@/utils/is';

type Context2D = CanvasRenderingContext2D;

function getContext2D(ele: HTMLCanvasElement): Context2D {
  let ctx = ele.getContext('2d', {
    willReadFrequently: true,
  });
  return ctx as Context2D;
}

/**
 * 判断正方形是否相交
 * @param rect1 [x1, y1, w1, h1]
 * @param rect2 [x2, y2, w2, h2]
 */
function computeRectIntersect(rect1: [number, number, number, number], rect2: [number, number, number, number]) {
  const xIntersect = Math.max(rect1[0], rect2[0]) < Math.min(rect1[0] + rect1[2], rect2[0] + rect2[2]);
  const yIntersect = Math.max(rect1[1], rect2[1]) < Math.min(rect1[1] + rect1[3], rect2[1] + rect2[3]);
  return xIntersect && yIntersect;
}

function getIntegerPoint(point: PointA) {
  return {
    x: Math.ceil(point.x),
    y: Math.ceil(point.y),
  };
}

function getRoundedPoint(point: PointA, isOdd: boolean = false) {
  return {
    x: Math.round(point.x) + (isOdd ? 0.5 : 0),
    y: Math.round(point.y) + (isOdd ? 0.5 : 0),
  };
}

/**
 * canvas 直接操作的封装
 * @returns CanvasExtendImp
 */
export default function useCanvas(): CanvasExtendImp {
  const extendCanvas = new ExtendCanvas();
  // 代理一下
  return new Proxy(extendCanvas, {
    get: (obj: any, prop) => {
      if (Reflect.has(obj, prop)) {
        return obj[prop];
      } else {
        throw new Error('DoNot get properties of ExtendCanvas!');
      }
    },
    set: (obj, prop, newValue) => {
      if (Reflect.has(obj, prop)) {
        obj[prop] = newValue;
      } else {
        const ctxs = obj.children as Array<Context2D>;
        ctxs.forEach((ctx) => (ctx[prop] = newValue));
      }
      return true;
    },
  }) as CanvasExtendImp;
}

const HISTORY_MAX = 30;

// 撤销重做数据（4块 ImageData）空代表这次没有更新这块
type SaveData = (ImageData | null)[];

export class ExtendCanvas implements CanvasExtendImp {
  // 将数据切分为4块
  private children: [Context2D, Context2D, Context2D, Context2D] = <any>[];
  private childrenCanvas: [HTMLCanvasElement, HTMLCanvasElement, HTMLCanvasElement, HTMLCanvasElement] = <any>[];
  private childrenPoints: [PointA, PointA, PointA, PointA] = <any>[];
  private width = 0;
  private height = 0;
  private canvasConfig = useEditorConfig();
  // 橡皮擦用
  private lastPoints: [PointA | null] = <any>[];
  // canvas 存储历史用于保存、撤销、重做操作
  // 当前数据
  private currentData: SaveData | null = null;
  // 撤销堆栈
  private revertStack: SaveData[] = [];
  // 重做堆栈
  private redoStack: SaveData[] = [];
  // 标记修改信息，记录当前修改了哪几块，优化内存使用和更新效率
  private changeInfo = [false, false, false, false];
  constructor() {}
  setupCanvas(
    width: number,
    height: number,
    childrenCanvas: [HTMLCanvasElement, HTMLCanvasElement, HTMLCanvasElement, HTMLCanvasElement],
  ) {
    this.width = width;
    this.height = height;
    this.childrenCanvas = childrenCanvas;
    this.children = <any>childrenCanvas.map((c) => getContext2D(c));
    this.childrenPoints = <any>[];
    for (let index = 0; index < 4; index++) {
      const childX = (this.width / 2) * (index % 2);
      const childY = (this.height / 2) * Math.floor(index / 2);
      this.childrenPoints.push({ x: childX, y: childY });
    }
    this.putSave();
  }
  private resetChanges() {
    this.changeInfo = [false, false, false, false];
  }
  putSave(data?: SaveData) {
    // 没有currentData第一次存储
    if (!this.currentData) {
      if (data) {
        this.currentData = data;
      } else {
        const saves: SaveData = [null, null, null, null];
        this.changeInfo.forEach((changed, index) => {
          if (changed) {
            saves[index] = this.children[index].getImageData(0, 0, this.width / 2, this.height / 2);
          }
        });
        this.resetChanges();
        this.currentData = saves;
      }
      return;
    }
    // 有currentData，非第一次存储，需要推入撤销堆栈
    let imageData = this.currentData;
    if (data) {
      this.currentData = data;
    } else {
      const saves: SaveData = [null, null, null, null];
      this.changeInfo.forEach((changed, index) => {
        if (changed) {
          saves[index] = this.children[index].getImageData(0, 0, this.width / 2, this.height / 2);
        }
        // ========= 特殊处理 =========
        // 为了解决下面【优化内存效率只记录部分更新数据】导致的撤销问题
        // 在这里额外判断是否有能够在撤销时使用的记录，多余记录一下，保证历史记录中必定存在4块中每一块的数据
        // ========= 特殊处理 =========
        if (this.revertStack.every((reverted) => isNull(reverted[index]))) {
          saves[index] = this.children[index].getImageData(0, 0, this.width / 2, this.height / 2);
        }
      });
      this.resetChanges();
      this.currentData = saves;
    }
    // 判断是否存满
    if (this.revertStack.length < HISTORY_MAX) {
      this.revertStack.push(imageData);
    } else {
      this.revertStack = this.revertStack.slice(1, HISTORY_MAX);
      this.revertStack.push(imageData);
    }
    if (!data && this.redoStack.length) {
      this.redoStack = [];
    }
  }
  /**
   * 重做
   */
  redo() {
    if (this.redoStack.length > 0 && this.currentData) {
      const saveData = this.redoStack.pop() as SaveData;
      // 修改内容全为空代表清空
      if (saveData.every((data) => isNull(data))) {
        saveData.forEach((_, index) => {
          this.children[index].clearRect(0, 0, this.width / 2, this.height / 2);
        });
      } else {
        saveData.forEach((data, index) => {
          if (data !== null) {
            this.children[index].putImageData(data, 0, 0);
          }
        });
      }
      this.putSave(saveData);
      message.info('重做');
      this.resetChanges();
    }
  }
  /**
   * 撤销(需要考虑第0块更新->第0、1块更新，此时撤销的情况)
   */
  undo() {
    if (this.revertStack.length > 0 && this.currentData) {
      const saveData = this.revertStack.pop() as SaveData;
      if (saveData.every((data) => isNull(data))) {
        saveData.forEach((_, index) => {
          this.children[index].clearRect(0, 0, this.width / 2, this.height / 2);
        });
      } else {
        for (let index = 0; index < 4; index++) {
          const data = saveData[index];
          if (data !== null) {
            this.children[index].putImageData(data, 0, 0);
          } else {
            // 此块当前有更新，但撤销后的数据无更新，需要向前查找最后一次更新的数据
            if (this.currentData[index] !== null) {
              const lastData = this.revertStack.findLast((reverted) => reverted[index] !== null);
              if (lastData) {
                this.children[index].putImageData(<ImageData>lastData[index], 0, 0);
              } else {
                // 这种情况实际无法处理，因为历史记录是有限的，因此在上面putSave时，特殊处理一下
              }
            }
            // 否则可以忽略
          }
        }
      }
      this.redoStack.push(this.currentData);
      this.currentData = saveData;
      message.info('撤销');
      this.resetChanges();
    }
  }
  // 清空
  clean(props?: Box) {
    if (!props) {
      this.children.forEach((child) => child.clearRect(0, 0, this.width / 2, this.height / 2));
    } else {
      this.children.forEach((child, index) => {
        const actualClearProps = props.slice() as Box;
        actualClearProps[0] -= this.childrenPoints[index].x;
        actualClearProps[1] -= this.childrenPoints[index].y;
        child.clearRect(...actualClearProps);
      });
    }
  }
  // 橡皮擦
  erase(point: PointA, isLast: boolean = false) {
    for (let index = 0; index < 4; index++) {
      const { x, y } = this.childrenPoints[index];
      if (computeRectIntersect([point.x - 20, point.y - 20, 2 * 20, 2 * 20], [x, y, this.width / 2, this.height / 2])) {
        // 计算偏移
        const _point = { x: point.x - x, y: point.y - y };
        this.eraseIn(index, _point, isLast);
        this.changeInfo[index] = true;
      }
    }
  }
  private eraseIn(index: number, point: PointA, isLast: boolean = false) {
    const ctx = this.children[index];
    if (!this.lastPoints[index]) {
      this.lastPoints[index] = point;
    } else {
      ctx.save();
      //设置擦除路径
      ctx.beginPath();
      // 清除上一次erase产生的圆和内部内容
      ctx.arc(
        (<PointA>this.lastPoints[index]).x,
        (<PointA>this.lastPoints[index]).y,
        this.canvasConfig.getEraseSize + 1,
        0,
        Math.PI * 2,
        false,
      );
      // 通过clip设置下一步清空时，只影响arc的内容
      ctx.clip();
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
    // 画橡皮（圆）
    if (!isLast) {
      ctx.save();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(point.x, point.y, this.canvasConfig.getEraseSize, 0, Math.PI * 2, false);
      ctx.clip();
      ctx.stroke();
      ctx.restore();
      this.lastPoints[index] = point;
    } else {
      this.lastPoints[index] = null;
    }
  }
  // 贝塞尔曲线
  drawSmoothLine(beginPoint: PointA, controlPoint: PointA, endPoint: PointA) {
    for (let index = 0; index < 4; index++) {
      const { x, y } = this.childrenPoints[index];
      if (
        computeRectIntersect(
          [
            Math.min(beginPoint.x, endPoint.x) - 30,
            Math.min(beginPoint.y, endPoint.y) - 30,
            Math.abs(endPoint.x - beginPoint.x) + 30,
            Math.abs(endPoint.y - beginPoint.y) + 30,
          ],
          [x, y, this.width / 2, this.height / 2],
        )
      ) {
        // 计算偏移
        const _beginPoint = { x: beginPoint.x - x, y: beginPoint.y - y };
        const _controlPoint = { x: controlPoint.x - x, y: controlPoint.y - y };
        const _endPoint = { x: endPoint.x - x, y: endPoint.y - y };
        this.drawSmoothLineIn(index, _beginPoint, _controlPoint, _endPoint);
        this.changeInfo[index] = true;
      }
    }
  }
  private drawSmoothLineIn(index: number, beginPoint: PointA, controlPoint: PointA, endPoint: PointA) {
    const ctx = this.children[index];
    beginPoint = getIntegerPoint(beginPoint);
    controlPoint = getIntegerPoint(controlPoint);
    endPoint = getIntegerPoint(endPoint);
    ctx.strokeStyle = this.canvasConfig.color;
    ctx.beginPath();
    ctx.moveTo(beginPoint.x, beginPoint.y);
    ctx.lineWidth = this.canvasConfig.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
    ctx.stroke();
  }
  // 绘制圆形
  drawCircle(point: PointA, radius: number, fill: boolean = false) {
    for (let index = 0; index < 4; index++) {
      const { x, y } = this.childrenPoints[index];
      if (
        computeRectIntersect(
          [point.x - radius, point.y - radius, 2 * radius, 2 * radius],
          [x, y, this.width / 2, this.height / 2],
        )
      ) {
        // 计算偏移
        const _point = { x: point.x - x, y: point.y - y };
        this.drawCircleIn(index, _point, radius, fill);
        this.changeInfo[index] = true;
      }
    }
  }
  private drawCircleIn(index: number, point: PointA, radius: number, fill: boolean = false) {
    const ctx = this.children[index];
    point = getRoundedPoint(point);
    ctx.beginPath();
    ctx.lineWidth = this.canvasConfig.lineWidth;
    ctx.strokeStyle = this.canvasConfig.color;
    ctx.arc(point.x, point.y, radius, 0, 360);
    fill ? ctx.fill() : ctx.stroke();
  }
  drawLine(beginPoint: PointA, endPoint: PointA) {
    for (let index = 0; index < 4; index++) {
      const { x, y } = this.childrenPoints[index];
      if (
        computeRectIntersect(
          [
            Math.min(beginPoint.x, endPoint.x),
            Math.min(beginPoint.y, endPoint.y),
            Math.abs(endPoint.x - beginPoint.x),
            Math.abs(endPoint.y - beginPoint.y),
          ],
          [x, y, this.width / 2, this.height / 2],
        )
      ) {
        // 计算偏移
        const _beginPoint = { x: beginPoint.x - x, y: beginPoint.y - y };
        const _endPoint = { x: endPoint.x - x, y: endPoint.y - y };
        this.drawLineIn(index, _beginPoint, _endPoint);
        this.changeInfo[index] = true;
      }
    }
  }
  private drawLineIn(index: number, beginPoint: PointA, endPoint: PointA) {
    const ctx = this.children[index];
    const isOdd = this.canvasConfig.lineWidth % 2 === 1;
    beginPoint = getRoundedPoint(beginPoint, isOdd);
    endPoint = getRoundedPoint(endPoint, isOdd);
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineWidth = this.canvasConfig.lineWidth;
    ctx.strokeStyle = this.canvasConfig.color;
    ctx.moveTo(beginPoint.x, beginPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
  }
  drawRect(beginPoint: PointA, endPoint: PointA, fill: boolean = false) {
    for (let index = 0; index < 4; index++) {
      const { x, y } = this.childrenPoints[index];
      if (
        computeRectIntersect(
          [
            Math.min(beginPoint.x, endPoint.x) - 30,
            Math.min(beginPoint.y, endPoint.y) - 30,
            Math.abs(endPoint.x - beginPoint.x) + 30,
            Math.abs(endPoint.y - beginPoint.y) + 30,
          ],
          [x, y, this.width / 2, this.height / 2],
        )
      ) {
        // 计算偏移
        const _beginPoint = { x: beginPoint.x - x, y: beginPoint.y - y };
        const _endPoint = { x: endPoint.x - x, y: endPoint.y - y };
        this.drawRectIn(index, _beginPoint, _endPoint, fill);
        this.changeInfo[index] = true;
      }
    }
  }
  private drawRectIn(index: number, beginPoint: PointA, endPoint: PointA, fill: boolean = false) {
    const ctx = this.children[index];
    const isOdd = this.canvasConfig.lineWidth % 2 === 1;
    beginPoint = getRoundedPoint(beginPoint, isOdd);
    endPoint = getRoundedPoint(endPoint, isOdd);
    ctx.beginPath();
    ctx.lineWidth = this.canvasConfig.lineWidth;
    ctx.strokeStyle = this.canvasConfig.color;
    fill
      ? ctx.fillRect(beginPoint.x, beginPoint.y, endPoint.x - beginPoint.x, endPoint.y - beginPoint.y)
      : ctx.strokeRect(beginPoint.x, beginPoint.y, endPoint.x - beginPoint.x, endPoint.y - beginPoint.y);
  }
  drawText(point: PointA, text: string) {
    for (let index = 0; index < 4; index++) {
      const { x, y } = this.childrenPoints[index];
      // 计算偏移
      const _point = { x: point.x - x, y: point.y - y };
      this.drawTextIn(index, _point, text);
      // TODO: 优化
      this.changeInfo[index] = true;
    }
  }
  private drawTextIn(index: number, point: PointA, text: string) {
    const ctx = this.children[index];
    ctx.font = '14px serif';
    ctx.fillStyle = 'white';
    ctx.fillText(text, point.x - text.length * 5, point.y);
  }
  getImageData(props?: [number, number, number, number]) {
    if (props) {
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = props[2];
      sliceCanvas.height = props[3];
      const ctx = sliceCanvas.getContext('2d') as CanvasRenderingContext2D;
      let usedX = 0;
      let usedY = 0;
      for (let index = 0; index < 4; index++) {
        const { x, y } = this.childrenPoints[index];
        if (computeRectIntersect(props, [x, y, this.width / 2, this.height / 2])) {
          // 在全图中的左上角坐标
          const startX = Math.max(props[0], x);
          const startY = Math.max(props[1], y);
          const width = Math.min(props[0] + props[2], x + this.width / 2) - startX;
          const height = Math.min(props[1] + props[3], y + this.height / 2) - startY;
          switch (index) {
            case 0:
              ctx.drawImage(this.childrenCanvas[0], startX, startY, width, height, 0, 0, width, height);
              usedX = width;
              usedY = height;
              break;
            case 1:
              ctx.drawImage(this.childrenCanvas[1], startX - x, startY, width, height, usedX, 0, width, height);
              usedY = height;
              break;
            case 2:
              ctx.drawImage(this.childrenCanvas[2], startX, startY - y, width, height, 0, usedY, width, height);
              usedX = width;
              break;
            case 3:
              ctx.drawImage(this.childrenCanvas[3], startX - x, startY - y, width, height, usedX, usedY, width, height);
              break;
          }
        }
      }
      return ctx.getImageData(0, 0, props[2], props[3]);
    } else {
      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = this.width;
      fullCanvas.height = this.height;
      const ctx = fullCanvas.getContext('2d') as CanvasRenderingContext2D;
      ctx.drawImage(this.childrenCanvas[0], 0, 0);
      ctx.drawImage(this.childrenCanvas[1], this.width / 2, 0);
      ctx.drawImage(this.childrenCanvas[2], 0, this.height / 2);
      ctx.drawImage(this.childrenCanvas[3], this.width / 2, this.height / 2);
      return ctx.getImageData(0, 0, this.width, this.height);
    }
  }
  async drawImageData(imageData, offsetX, offsetY, width, height) {
    const bitmap = await createImageBitmap(imageData);
    for (let index = 0; index < 4; index++) {
      const { x, y } = this.childrenPoints[index];
      if (computeRectIntersect([offsetX, offsetY, width, height], [x, y, this.width / 2, this.height / 2])) {
        // 直接绘制完整不裁剪的图形，通过坐标去除多余的部分
        this.children[index].drawImage(bitmap, offsetX - x, offsetY - y, width, height);
      }
    }
  }
  destroy() {
    this.children = <any>[];
    this.childrenCanvas = <any>[];
    this.canvasConfig = <any>null;
    this.currentData = null;
    this.revertStack = [];
    this.redoStack = [];
  }
}
