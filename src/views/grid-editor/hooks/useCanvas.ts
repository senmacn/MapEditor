import { isFunction } from 'lodash-es';
import { ref, unref } from 'vue';

interface CanvasInstance {
  setupCanvas: (canvas: CanvasRenderingContext2D) => void;
  getCanvas: () => CanvasRenderingContext2D;
  save: () => void;
  revert: () => void;
  getHistoryUseful: () => boolean;
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
    const canvas = unref(canvasRef);
    if (canvas) return canvas;
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
    const canvas = getCanvas();
    const data = canvas.getImageData(0, 0, canvas.canvas.width, canvas.canvas.height);
    canvasHistory.push(data);
    historyLengthRef.value = historyLengthRef.value + 1;
  };
  const revert = () => {
    const canvas = getCanvas();
    if (historyLengthRef.value === 1) {
      const data = canvasHistory[0];
      canvas.putImageData(data, 0, 0);
    } else {
      canvasHistory.pop();
      historyLengthRef.value = historyLengthRef.value - 1;
      const data = canvasHistory[historyLengthRef.value - 1];
      if (!data) return;
      canvas.putImageData(data, 0, 0);
    }
  };
  const getHistoryUseful = () => historyLengthRef.value > 0;

  const canvasInstance: CanvasInstance = {
    setupCanvas,
    getCanvas,
    save,
    revert,
    getHistoryUseful,
  };
  // 代理一下
  return new Proxy(canvasInstance, {
    get: (obj: any, prop) => {
      if (obj.hasOwnProperty(prop)) {
        return obj[prop];
      } else {
        const canvas = getCanvas() as any;
        const value = canvas[prop];
        return isFunction(value) ? value.bind(canvas) : value;
      }
    },
    set: (obj, prop, newValue) => {
      const canvas = getCanvas() as any;
      canvas[prop] = newValue;
      return true;
    },
  }) as CanvasInstance & CanvasRenderingContext2D;
}
