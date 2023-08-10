import DownloadWorker from '@/worker/download-boundary-positions.worker?worker';
import { useCanvasState } from '@/store/modules/canvas-state';
import { useLocalState } from '@/store/modules/local-state';
import { getLocalApi } from '@/utils/env';
import { exportFile } from '@/utils/file';
import { message, notification } from 'ant-design-vue';
import { useEditorConfig } from '@/store/modules/editor-config';
import { useProgressEvent } from '@/components/controlled-progress';
import { canvasToFile } from '@/utils/file/image';

export function handleExportBoundary() {
  const configRef = useEditorConfig();
  const localState = useLocalState();
  const localApi = getLocalApi();
  const canvasState = useCanvasState();
  const [start, progress] = useProgressEvent();

  let iter = canvasState.getAreaMap.values();
  let areaNext = iter.next();

  start(canvasState.getAreaMap.size);

  while (!areaNext.done) {
    const name = areaNext.value.getName(),
      boundRect = areaNext.value.getBoundRect(),
      data = areaNext.value.getData();

    const worker = new DownloadWorker();
    worker.onmessage = async function (e) {
      const fileName = name + '.boundary.json';
      const retData = e.data;
      if (localApi) {
        const e = await localApi.saveLocalFile(
          fileName,
          JSON.stringify(retData),
          localState.getDownloadLocation,
        );
        // #[test]
        // let maskCanvas: HTMLCanvasElement | null = document.querySelector('#mask-canvas');
        // if (maskCanvas == null) return;
        // maskCanvas.style.display = 'block';
        // let ctx = maskCanvas.getContext('2d', {}) as CanvasRenderingContext2D;
        // ctx.fillStyle = 'red';
        // console.log(retData);
        // const formatPoints = retData.value.map((point) => ([
        //   Math.round(
        //     Number(configRef.getProjectSizeConfig.startPointX) +
        //       (point[0] + boundRect[0]) * Number(configRef.getProjectSizeConfigScale) +
        //       50,
        //   ),
        //   Math.round(
        //     Number(configRef.getMapSize.ltY) +
        //       (point[1] + boundRect[1]) * Number(configRef.getProjectSizeConfigScale) +
        //       50,
        //   ),
        // ]));
        // console.log('111', formatPoints);

        // retData.value.forEach((p) => {
        //   ctx.fillRect(Math.round(p[0]), Math.round(p[1]), 1, 1);
        // });
        // test end
        if (e) {
          message.error(`区域[${name}]导出失败！`);
          console.error(e);
          return;
        }
      } else {
        exportFile(fileName, retData);
      }
      progress();
      notification.success({
        message: '下载边框坐标',
        description: `区域[${name}]下载完成！`,
      });
      worker.terminate();
    };
    worker.onerror = function (event) {
      console.error(event);
      message.error('下载失败！');
      worker.terminate();
    };

    worker.postMessage([
      data,
      boundRect[0],
      boundRect[1],
      Number(configRef.getProjectSizeConfig.startPointX),
      Number(configRef.getProjectSizeConfig.startPointY),
      Number(configRef.getProjectSizeConfigScale),
      areaNext.value.type,
    ]);

    areaNext = iter.next();
  }
  const dataCanvas = document.createElement('canvas');
  dataCanvas.width = configRef.getProjectSizeConfigFullWidth;
  dataCanvas.height = configRef.getProjectSizeConfigFullHeight;
  const dataContext = dataCanvas.getContext('2d', {
    willReadFrequently: true,
  }) as CanvasRenderingContext2D;
  canvasState.getAreaMap.forEach((area) => {
    const boundRect = area.getBoundRect();
    // 创建临时画布
    const cacheCanvas = document.createElement('canvas');
    cacheCanvas.width = boundRect[2];
    cacheCanvas.height = boundRect[3];
    const cacheCtx = cacheCanvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    cacheCtx.putImageData(area.getData(), 0, 0);
    // putImageData会相互覆盖，使用drawImage
    console.log(configRef.getProjectSizeConfigPxOffsetX);
    console.log(configRef.getProjectSizeConfigPxOffsetY);
    console.log(boundRect);
    
    dataContext.drawImage(
      cacheCanvas,
      configRef.getProjectSizeConfigPxOffsetX + boundRect[0],
      configRef.getProjectSizeConfigPxOffsetY + boundRect[1],
    );
  });
  // compressImage(dataCanvas.toDataURL(), 8192, 8192).then((blob) => {
  //   blob?.arrayBuffer().then((buffer) => {
  //     localApi?.saveLocalFile('2d_areas.jpg', buffer as Buffer, localState.getDownloadLocation);
  //   });
  // });
  // compressImage(dataCanvas.toDataURL(), 2048, 2048).then((blob) => {
  //   blob?.arrayBuffer().then((buffer) => {
  //     localApi?.saveLocalFile('2d_areas_2048.jpg', buffer as Buffer, localState.getDownloadLocation);
  //   });
  // });
  canvasToFile(dataCanvas, 'image/png', 1)
    .then((blob) => {
      if (!blob) {
        message.warning('构建图片数据为空，请检查区域或尺寸设置！');
      }
      blob?.arrayBuffer().then((buffer) => {
        localApi?.saveLocalFile(
          '10000_boundary.png',
          buffer as Buffer,
          localState.getDownloadLocation,
        );
      });
    })
    .catch((err) => {
      console.log(err);
      message.error('图片下载失败！');
    });
}
