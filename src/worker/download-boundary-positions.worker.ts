import { getPosition } from '@/views/default-editor/utils/image-data-util';

addEventListener(
  'message',
  function (event) {
    const data = event.data;
    const [imageData, offsetX, offsetY, ltX, ltY, scale, type] = data;
    const points = getPosition(imageData);
    // 取转换厘米后方块中心点
    const formatPoints = points.map((point) => [
      ltX + (point[0] + offsetX) * scale + 50,
      ltY + (point[1] + offsetY) * scale + 50,
    ]);
    postMessage({
      type: type,
      value: formatPoints,
    });
    this.self.close();
  },
  false,
);
