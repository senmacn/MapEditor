import { message } from 'ant-design-vue';
import { useLoading } from './components/Loading';
import { useLocalState } from './store/modules/local-state';
import { getLocalApi } from './utils/env';
import { loadSaves } from './utils/persist';
import { useCanvasState } from './store/modules/canvas-state';
import controller from './views/default-editor/common/canvas-state-controller';
import { emitFocusAreaEvent } from './views/default-editor/common/event';

function parseQueryString(hash: string) {
  const params: Recordable = {};
  const keyValuePairs = hash.replace('#/map-editor?', '').split('&');
  keyValuePairs.forEach((pair) => {
    const [key, value] = pair.split('=');
    params[key] = value;
  });

  return params;
}

export default function loadingSaves() {
  const localState = useLocalState();
  const localApi = getLocalApi();
  const canvasState = useCanvasState();
  const [openLoading, closeLoading] = useLoading({ minTime: 10000, tip: '读取存档中~' });

  const { name, uuid } = parseQueryString(location.hash);
  if (name) {
    return new Promise((resolve) => {
      localState.setFileName(name as string);
      openLoading();
      localApi &&
        localApi
          .getLocalFileContent(name as string)
          .then((data) => {
            try {
              const result = loadSaves(data, true);
              canvasState.setLayers(result?.layers);
              controller.setCurrentLayer(canvasState.getLayers[canvasState.getLayers.length - 1]);
              if (uuid) {
                setTimeout(() => {
                  if (canvasState.getPinMap.has(uuid)) {
                    emitFocusAreaEvent(canvasState.getPinMap.get(uuid));
                  }
                }, 1000);
              }
            } catch (e: any) {
              console.warn(e);
              message.warning({
                content: e.message,
                duration: 60000,
              });
            }
          })
          .finally(() => {
            setTimeout(() => closeLoading(), 100);
            resolve(1);
          });
    });
  } else {
    localState.setFileName('新建项目');
  }
}
