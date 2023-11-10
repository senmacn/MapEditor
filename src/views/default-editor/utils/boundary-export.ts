import DownloadWorker from '@/worker/download-boundary-positions.worker?worker';
import { useCanvasState } from '@/store/modules/canvas-state';
import { useLocalState } from '@/store/modules/local-state';
import { getLocalApi } from '@/utils/env';
import { exportFile } from '@/utils/file';
import { message, notification } from 'ant-design-vue';
import { useEditorConfig } from '@/store/modules/editor-config';
import { useProgressEvent } from '@/components/controlled-progress';
import { canvasToFile } from '@/utils/file/image';

function getCObject(list: Point[]) {
  return {
    points: list.map((p) => ({
      X: p[0],
      Y: p[1],
    })),
  };
}

export function handleExportBoundary(interval: number, exportType = true) {
  const configRef = useEditorConfig();
  const localState = useLocalState();
  const localApi = getLocalApi();
  const canvasState = useCanvasState();
  const [start, progress] = useProgressEvent();

  const iter = canvasState.getAreaMap.values();
  let areaNext = iter.next();

  start(canvasState.getAreaMap.size);

  while (!areaNext.done) {
    const name = areaNext.value.getName(),
      boundRect = areaNext.value.getActualBoundRect(),
      data = areaNext.value.getData();

    const worker = new DownloadWorker();
    worker.onmessage = async function (e) {
      const fileName = name + '.boundary.json';
      const retData = e.data;
      if (localApi) {
        const e = await localApi.saveLocalFile(
          fileName,
          JSON.stringify(exportType ? retData : getCObject(retData.value)),
          localState.getDownloadLocation,
        );
        // #[test]
        // let maskCanvasAll: HTMLCanvasElement | null = document.querySelector('#mask-canvas');
        // maskCanvasAll.style.display = 'block';
        // let maskCanvas: HTMLCanvasElement | null = document.querySelector('#mask-canvas-1');
        // if (maskCanvas == null) return;
        // maskCanvas.style.display = 'block';
        // let ctx = maskCanvas.getContext('2d', {}) as CanvasRenderingContext2D;
        // ctx.strokeStyle = '#00e000';
        // console.log(retData);
        // ctx.beginPath();
        // ctx.moveTo(retData.value[retData.value.length - 1].x, retData.value[retData.value.length - 1].y);
        // (retData.value as Point[]).forEach((p) => {
        //   ctx.lineTo(p[0], p[1]);
        // });
        // ctx.stroke();
        // test end
        if (e) {
          message.error(`区域[${name}]导出失败！`);
          console.error(e);
          return;
        }
      } else {
        exportType ? exportFile(fileName, retData) : exportFile(fileName, getCObject(retData.value));
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
      [...areaNext.value.getChoosePoint()],
      interval,
    ]);

    areaNext = iter.next();
  }
  // 用于生成碰撞检测的话，在这里已经可以返回了
  if (!exportType) {
    return;
  }
  // 用于策划观察边框，还需要生成图片
  const dataCanvas = document.createElement('canvas');
  dataCanvas.width = configRef.getProjectSizeConfigFullWidth;
  dataCanvas.height = configRef.getProjectSizeConfigFullHeight;
  const dataContext = dataCanvas.getContext('2d', {
    willReadFrequently: true,
  }) as CanvasRenderingContext2D;
  canvasState.getAreaMap.forEach((area) => {
    const boundRect = area.getActualBoundRect();
    // putImageData会相互覆盖，使用drawImage
    const initData = area.getData();
    const offscreenCanvas = new OffscreenCanvas(initData.width, initData.height);
    const context = <OffscreenCanvasRenderingContext2D>offscreenCanvas.getContext('2d', {
      willReadFrequently: true,
    });
    context?.putImageData(initData, 0, 0);
    dataContext.drawImage(
      offscreenCanvas,
      configRef.getProjectSizeConfigPxOffsetX + boundRect[0],
      configRef.getProjectSizeConfigPxOffsetY + boundRect[1],
    );
  });
  canvasToFile(dataCanvas, 'image/png', 1)
    .then((blob) => {
      if (!blob) {
        message.warning('构建图片数据为空，请检查区域或尺寸设置！');
      }
      blob?.arrayBuffer().then((buffer) => {
        localApi?.saveLocalFile('10000_boundary.png', buffer as Buffer, localState.getDownloadLocation);
      });
    })
    .catch(() => {
      message.error('图片下载失败！');
    });
}
