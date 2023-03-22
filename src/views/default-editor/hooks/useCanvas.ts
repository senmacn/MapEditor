import { isFunction } from 'lodash-es';
import { ref, unref } from 'vue';

export interface CanvasInstance {
  setupCanvas: (canvas: CanvasRenderingContext2D) => void;
  save: () => void;
  revert: () => void;
  clean: () => void;
  getHistoryUseful: () => boolean;
  drawSmoothLine: (beginPoint: PointA, controlPoint: PointA, endPoint: PointA) => void;
  drawLine: (beginPoint: PointA, endPoint: PointA) => void;
  drawDashLine: (beginPoint: PointA, endPoint: PointA) => void;
}

/**
 * canvas 直接操作的封装
 * @returns CanvasInstance
 */
export default function useCanvas(): CanvasInstance & CanvasRenderingContext2D {
  const canvasRef = ref<CanvasRenderingContext2D>();
  const setupCanvas = (canvas: CanvasRenderingContext2D) => {
    canvasRef.value = canvas;
  };
  const getCanvas = () => {
    const ctx = unref(canvasRef);
    if (ctx) return ctx;
    throw new Error('Canvas Not Found');
  };
  // canvas 存储历史用于撤销操作
  const canvasHistory: ImageData[] & Recordable = [];
  const historyLengthRef = ref(0);
  canvasHistory.putIn = function (value: ImageData) {
    if (this.length === 20) {
      this.shift();
    }
    this.push(value);
  };
  const save = () => {
    const ctx = getCanvas();
    const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    canvasHistory.push(data);
    historyLengthRef.value = historyLengthRef.value + 1;
  };
  const revert = () => {
    const ctx = getCanvas();
    if (historyLengthRef.value === 1) {
      const data = canvasHistory[0];
      ctx.putImageData(data, 0, 0);
    } else {
      canvasHistory.pop();
      historyLengthRef.value = historyLengthRef.value - 1;
      const data = canvasHistory[historyLengthRef.value - 1];
      if (!data) return;
      ctx.putImageData(data, 0, 0);
    }
  };
  const getHistoryUseful = () => historyLengthRef.value > 0;

  // 清空
  function clean() {
    const ctx = getCanvas();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    save();
  }

  // 贝塞尔曲线
  const drawSmoothLine = (beginPoint: PointA, controlPoint: PointA, endPoint: PointA) => {
    const ctx = getCanvas();
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(beginPoint.x, beginPoint.y);
    ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
    ctx.stroke();
    ctx.closePath();
  };

  // 普通直线
  const drawLine = (beginPoint: PointA, endPoint: PointA) => {
    const ctx = getCanvas();
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(beginPoint.x, beginPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
    ctx.closePath();
  };

  const drawDashLine = (beginPoint: PointA, endPoint: PointA) => {
    const ctx = getCanvas();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'gray';
    ctx.beginPath();
    ctx.moveTo(beginPoint.x, beginPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
    ctx.closePath();
  };

  const canvasInstance: CanvasInstance = {
    setupCanvas,
    save,
    revert,
    getHistoryUseful,
    clean,
    drawSmoothLine,
    drawLine,
    drawDashLine,
  };
  // 代理一下
  return new Proxy(canvasInstance, {
    get: (obj: any, prop) => {
      if (obj.hasOwnProperty(prop)) {
        return obj[prop];
      } else {
        const ctx = getCanvas() as any;
        const value = ctx[prop];
        return isFunction(value) ? value.bind(ctx) : value;
      }
    },
    set: (obj, prop, newValue) => {
      const ctx = getCanvas() as any;
      ctx[prop] = newValue;
      return true;
    },
  }) as CanvasInstance & CanvasRenderingContext2D;
}
