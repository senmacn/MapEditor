import { isFunction } from 'lodash-es';
import { CanvasConfig, CanvasExtendImp } from '../common/types';

export type CanvasInstance = CanvasExtendImp & CanvasRenderingContext2D;

export class ExtendCanvas implements CanvasExtendImp {
  private canvasInstance: CanvasRenderingContext2D | null = null;
  private canvasConfig: CanvasConfig = {
    style: {},
    zoom: 1,
    lineWidth: 1,
    color: 'red',
    density: 1,
    autoConnect: true,
  };
  // 橡皮擦用
  private lastPoint: PointA | null = null;
  // canvas 存储历史用于保存、撤销、还原操作
  private canvasHistory: ImageData[] & Recordable = [];
  private historyState = {
    current: -1,
    max: -1,
  };
  constructor() {}
  setupCanvas(canvasInstance: CanvasRenderingContext2D, config?: CanvasConfig) {
    this.canvasInstance = canvasInstance;
    if (config) {
      this.canvasConfig = config;
    }
    if (this.historyState.current < 0) {
      this.save();
    }
  }
  getCanvas() {
    if (this.canvasInstance) return this.canvasInstance;
    throw new Error('Canvas Not Found');
  }
  save() {
    const ctx = this.getCanvas();
    const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (this.historyState.max === 19) {
      this.canvasHistory.shift();
      this.historyState.max = this.historyState.current;
    } else {
      this.canvasHistory.splice(++this.historyState.current);
      this.historyState.max = this.historyState.current;
    }
    this.canvasHistory.push(data);
  }
  redo() {
    const ctx = this.getCanvas();
    if (this.historyState.current < this.historyState.max) {
      const data = this.canvasHistory[++this.historyState.current];
      if (!data) return;
      ctx.putImageData(data, 0, 0);
    }
  }
  undo() {
    const ctx = this.getCanvas();
    if (this.historyState.current > 0) {
      const data = this.canvasHistory[--this.historyState.current];
      if (!data) return;
      ctx.putImageData(data, 0, 0);
    }
  }

  // 清空
  clean() {
    const ctx = this.getCanvas();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.save();
  }
  // 橡皮擦
  erase = (point: PointA, isLast: boolean = false) => {
    const ctx = this.getCanvas();
    if (!this.lastPoint) {
      this.lastPoint = point;
    } else {
      ctx.save();
      //设置擦除路径
      ctx.beginPath();
      // 清除上一次erase产生的圆和内部内容
      ctx.arc(this.lastPoint.x, this.lastPoint.y, 11, 0, Math.PI * 2, false);
      // 通过clip设置下一步清空时，只影响arc的内容
      ctx.clip();
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
    // 画橡皮（圆）
    if (!isLast) {
      ctx.save();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 10, 0, Math.PI * 2, false);
      ctx.clip();
      ctx.stroke();
      ctx.restore();
      this.lastPoint = point;
    } else {
      this.lastPoint = null;
    }
  };
  // 贝塞尔曲线
  drawSmoothLine(beginPoint: PointA, controlPoint: PointA, endPoint: PointA) {
    const ctx = this.getCanvas();
    ctx.strokeStyle = this.canvasConfig.color;
    ctx.beginPath();
    ctx.moveTo(beginPoint.x, beginPoint.y);
    ctx.lineWidth = this.canvasConfig.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
    ctx.stroke();
  }
  // 普通直线
  drawLine(beginPoint: PointA, endPoint: PointA) {
    const ctx = this.getCanvas();
    ctx.strokeStyle = this.canvasConfig.color;
    ctx.beginPath();
    ctx.lineWidth = this.canvasConfig.lineWidth;
    ctx.moveTo(beginPoint.x, beginPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
  }
  // 画虚线
  drawDashLine(beginPoint: PointA, endPoint: PointA) {
    const ctx = this.getCanvas();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = this.canvasConfig.lineWidth;
    ctx.beginPath();
    ctx.moveTo(beginPoint.x, beginPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
  }
  getImageData() {
    const ctx = this.getCanvas();
    return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}

/**
 * canvas 直接操作的封装
 * @returns CanvasInstance
 */
export default function useCanvas(): CanvasInstance {
  const extendCanvas = new ExtendCanvas();
  // 代理一下
  return new Proxy(extendCanvas, {
    get: (obj: any, prop) => {
      if (Reflect.has(obj, prop)) {
        return obj[prop];
      } else {
        const ctx = obj.getCanvas() as any;
        const value = ctx[prop];
        return isFunction(value) ? value.bind(ctx) : value;
      }
    },
    set: (obj, prop, newValue) => {
      if (Reflect.has(obj, prop)) {
        obj[prop] = newValue;
      } else {
        const ctx = obj.getCanvas() as any;
        ctx[prop] = newValue;
      }
      return true;
    },
  }) as CanvasInstance;
}
