import * as wasm from '@/assets/wasm/map_editor_wasm';

addEventListener(
  'message',
  async function (event) {
    const {
      data,
      width,
      height,
      color,
      point,
      wasmBytes,
    }: {
      data: ArrayBufferLike;
      width: number;
      height: number;
      wasmBytes: ArrayBuffer;
      color: [number, number, number, number];
      point: [number, number];
    } = event.data;

    // 实例化WASM模块
    wasm.initSync(wasmBytes);
    const innerData = new Uint8Array(data);
    const result = wasm.wasm_flood_fill(innerData, width, height, ...point, ...color);
    const newImageData = new ImageData(new Uint8ClampedArray(result), width, height);
    postMessage(newImageData);
    this.self.close();
  },
  false,
);
