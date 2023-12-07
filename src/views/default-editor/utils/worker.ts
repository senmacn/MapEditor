import FloodWorker from '@/worker/flood.worker?worker';

/**
 * 快速进行洪水(分块洪水，对于某些凹多边形可能会造成填充较少！)
 * @param imageData 不会修改原有imageData
 * @param color 填充颜色
 * @param point 填充起始点s
 */
export function quickFillArea(imageData: ImageData, color: string, point: [number, number]) {
  return new Promise((resolve) => {
    const { width, height } = imageData;
    const offscreenCanvas = new OffscreenCanvas(width, height);
    const context = <OffscreenCanvasRenderingContext2D>offscreenCanvas.getContext('2d', {
      willReadFrequently: true,
    });
    context.putImageData(imageData, 0, 0);
    Promise.all([
      new Promise((res) => {
        const fw = new FloodWorker();
        const start = 0;
        const end = 0;
        const _width = point[0] - 1 + 1;
        const _height = point[1] - 1 + 1;
        fw.postMessage({
          data: context.getImageData(start, end, _width, _height),
          color,
          point: [point[0] - 1, point[1] - 1],
        });
        fw.onmessage = function (event) {
          const { data } = event;
          if (data) {
            context.putImageData(data, start, end);
            res(0);
          }
        };
      }),
      new Promise((res) => {
        const fw = new FloodWorker();
        const start = point[0];
        const end = 0;
        const _width = width - point[0];
        const _height = point[1] - 1 + 1;
        fw.postMessage({
          data: context.getImageData(start, end, _width, _height),
          color,
          point: [0, point[1] - 1],
        });
        fw.onmessage = function (event) {
          const { data } = event;
          if (data) {
            context.putImageData(data, start, end);
            res(0);
          }
        };
      }),
      new Promise((res) => {
        const fw = new FloodWorker();
        const start = 0;
        const end = point[1];
        const _width = point[0] - 1 + 1;
        const _height = height - point[1];
        fw.postMessage({
          data: context.getImageData(start, end, _width, _height),
          color,
          point: [point[0] - 1, 0],
        });
        fw.onmessage = function (event) {
          const { data } = event;
          if (data) {
            context.putImageData(data, start, end);
            res(0);
          }
        };
      }),
      new Promise((res) => {
        const fw = new FloodWorker();
        const start = point[0];
        const end = point[1];
        const _width = width - point[0];
        const _height = height - point[1];
        fw.postMessage({
          data: context.getImageData(start, end, _width, _height),
          color,
          point: [0, 0],
        });
        fw.onmessage = function (event) {
          const { data } = event;
          if (data) {
            context.putImageData(data, start, end);
            res(0);
          }
        };
      }),
    ]).then(() => {
      resolve(context.getImageData(0, 0, width, height));
    });
  });
}
