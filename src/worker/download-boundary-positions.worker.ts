import { getPosition } from '@/views/default-editor/utils/image-data-util';

addEventListener(
  'message',
  function (event) {
    const data = event.data;
    const [imageData, ltX, ltY, scale, type] = data;
    const points = getPosition(imageData);
    // 取转换厘米后方块中心点
    const formatPoints = points.map((point) => [
      ltX + point[0] * scale + 50,
      ltY + point[1] * scale + 50,
    ]);
    console.log('ltX', ltX);
    console.log('scale', scale);
    postMessage({
      type: type,
      value: formatPoints,
    });
    this.self.close();
  },
  false,
);
