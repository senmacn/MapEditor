import { getPosition } from '@/views/default-editor/utils/image-data-util';

addEventListener(
  'message',
  function (event) {
    const data = event.data;
    const [imageData, offsetX, offsetY, ltX, ltY, scale, type] = data;
    const points = getPosition(imageData);
    const formatPoints = points.map((point) => [
      ltX + (point[0] + offsetX) * scale,
      ltY + (point[1] + offsetY) * scale,
    ]);
    postMessage({
      type: type,
      value: formatPoints,
    });
    this.self.close();
  },
  false,
);
