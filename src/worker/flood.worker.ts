import FloodFill from '@/utils/q-floodfill';

addEventListener(
  'message',
  function (event) {
    const { data, color, point }: { data: ImageData; color: string; point: [number, number] } = event.data;
    const floodFill = new FloodFill(data, true);
    floodFill.fill(color, point[0], point[1], 0);
    postMessage(floodFill.imageData);
    this.self.close();
  },
  false,
);
