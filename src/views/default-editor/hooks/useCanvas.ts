import { isFunction } from 'lodash-es';
import { ref, unref } from 'vue';
import { CanvasConfig } from './useCanvasConfig';

export type CanvasInstance = {
  setupCanvas: (canvas: CanvasRenderingContext2D, config?: CanvasConfig) => void;
  save: () => void;
  revert: () => void;
  clean: () => void;
  erase(point: PointA, isLast?: boolean): void;
  getHistoryUseful: () => boolean;
  drawSmoothLine: (beginPoint: PointA, controlPoint: PointA, endPoint: PointA) => void;
  drawLine: (beginPoint: PointA, endPoint: PointA) => void;
  drawDashLine: (beginPoint: PointA, endPoint: PointA) => void;
  getImageData: () => ImageData;
} & CanvasRenderingContext2D;

/**
 * canvas 直接操作的封装
 * @returns CanvasInstance
 */
export default function useCanvas(): CanvasInstance & CanvasRenderingContext2D {
  const canvasRef = ref<CanvasRenderingContext2D>();
  const canvasConfig = ref<CanvasConfig>({
    style: {},
    zoom: 1,
    color: 'red',
    density: 1,
    autoConnect: true,
  });
  const setupCanvas = (canvas: CanvasRenderingContext2D, config?: CanvasConfig) => {
    canvasRef.value = canvas;
    if (config) {
      canvasConfig.value = config;
    }
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
  // 橡皮擦
  let lastPoint: PointA | null = null;
  const erase = (point: PointA, isLast: boolean = false) => {
    const ctx = getCanvas();
    if (!lastPoint) {
      lastPoint = point;
    } else {
      ctx.save();
      //设置擦除路径
      ctx.beginPath();
      // 清除上一次erase产生的圆和内部内容
      ctx.arc(lastPoint.x, lastPoint.y, 11, 0, Math.PI * 2, false);
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
      lastPoint = point;
    } else {
      lastPoint = null;
    }
  };
  // 贝塞尔曲线
  function drawSmoothLine(beginPoint: PointA, controlPoint: PointA, endPoint: PointA) {
    const ctx = getCanvas();
    ctx.strokeStyle = canvasConfig.value.color;
    ctx.beginPath();
    ctx.moveTo(beginPoint.x, beginPoint.y);
    ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
    ctx.stroke();
    ctx.closePath();
  }
  // 普通直线
  function drawLine(beginPoint: PointA, endPoint: PointA) {
    const ctx = getCanvas();
    ctx.strokeStyle = canvasConfig.value.color;
    ctx.beginPath();
    ctx.moveTo(beginPoint.x, beginPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
    ctx.closePath();
  }
  // 画虚线
  function drawDashLine(beginPoint: PointA, endPoint: PointA) {
    const ctx = getCanvas();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'gray';
    ctx.beginPath();
    ctx.moveTo(beginPoint.x, beginPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
    ctx.closePath();
  }
  function getImageData() {
    const ctx = getCanvas();
    return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  const canvasInstance = {
    setupCanvas,
    save,
    revert,
    getHistoryUseful,
    clean,
    erase,
    drawSmoothLine,
    drawLine,
    drawDashLine,
    getImageData,
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
  }) as CanvasInstance;
}
