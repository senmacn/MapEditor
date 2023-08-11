import { useLoading } from '@/components/Loading';
import { useCanvasState } from '@/store/modules/canvas-state';
import { useEditorConfig } from '@/store/modules/editor-config';
import { useLocalState } from '@/store/modules/local-state';
import { getFormatDate } from '@/utils/date';
import { getLocalApi, isLocal } from '@/utils/env';
import { exportFile } from '@/utils/file';
import { isObject } from '@/utils/is';
import { createSaves } from '@/utils/persist';
import { message, Modal } from 'ant-design-vue';
import { debounce } from 'lodash-es';
import { onMounted, onUnmounted } from 'vue';

export default function useSaves() {
  const localApi = getLocalApi();
  const localState = useLocalState();
  const configRef = useEditorConfig();
  const canvasState = useCanvasState();

  const [openLoading, closeLoading] = useLoading({ tip: '保存中', minTime: 500 });

  // 防止重复运行
  let isSaving = false;

  function handleConfirmCreateSaves() {
    return new Promise((resolve) => {
      Modal.confirm({
        title: '确认',
        content: '保存当前编辑的数据存档？',
        okText: '确定',
        cancelText: '取消',
        onOk: () => {
          openLoading();
          setTimeout(async () => {
            await handleCreateSaves();
            resolve(true);
            message.success('保存成功！');
            closeLoading();
          });
        },
      });
    });
  }

  async function handleCreateSaves() {
    if (isSaving) return;
    try {
      isSaving = true;
      const fileName =
        localState.getFileName !== '新建项目'
          ? localState.getFileName
          : `map_data_${configRef.getProjectSizeConfigPxWidth}x${
              configRef.getProjectSizeConfigPxHeight
            }.${getFormatDate(new Date(), 'MM-dd_hh-mm')}.json`;
      if (localApi) {
        const data = await createSaves(canvasState.getLayers);
        await localApi.saveLoads(fileName, data);
        localState.setFileName(fileName);
        location.href = location.href.slice().replace(/\#\/.+/, '#/map-editor?name=' + fileName);
      }
      isSaving = false;
      return fileName;
    } catch (_err) {
      isSaving = false;
      message.error('保存失败！');
      console.warn(_err);
      throw new Error();
    }
  }

  function handleExportSaves(expLayer) {
    Modal.confirm({
      title: '提醒',
      type: 'confirm',
      content: '导出当前编辑的数据存档？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        const fileName = `map_data_${configRef.getProjectSizeConfigPxWidth}x${
          configRef.getProjectSizeConfigPxHeight
        }.${getFormatDate(new Date(), 'MM-dd_hh-mm')}.json`;
        const data = await createSaves(expLayer);
        if (localApi) {
          console.log(data);
          const str = await localApi.stringifyData(data);
          console.log(str);
          
          if (isObject(str) && str?.showMessage) {
            message.error('导出失败！');
            return;
          }
          localApi
            .saveLocalFile(fileName, str as string, localState.getExportLocation)
            .then((e) => {
              if (e) {
                message.error('导出失败！');
              }
              message.success('导出成功！');
            })
            .finally(() => {});
        } else {
          exportFile(fileName, data, 'json');
        }
      },
    });
  }

  // 按键保存
  const handleKeyboardSave = debounce(async function (e: KeyboardEvent) {
    if (e.key === 's' && e.ctrlKey) {
      if (isSaving) return;
      const config = await localApi?.getCustomConfig();
      if (config?.ctrlSSaveProject) {
        openLoading();
        setTimeout(() => {
          handleCreateSaves().then(() => {
            message.success('保存成功！');
            closeLoading();
          });
        }, 16);
      }
    }
  }, 250);

  // 自动保存相关
  let endAutoSave: any = null;
  function handleAutoSave() {
    try {
      handleCreateSaves().then(() => {
        message.success('自动保存成功！');
      });
    } catch (_) {}
    if (localState.getAutoSaveTime) {
      endAutoSave = setTimeout(handleAutoSave, localState.getAutoSaveTime * 60 * 1000);
    }
  }
  onMounted(() => {
    if (localState.getAutoSaveTime && isLocal()) {
      endAutoSave = setTimeout(handleAutoSave, localState.getAutoSaveTime * 60 * 1000);
    }

    document.body.addEventListener('keydown', handleKeyboardSave);
  });
  onUnmounted(() => {
    endAutoSave && clearTimeout(endAutoSave);

    handleKeyboardSave.cancel();
    document.body.removeEventListener('keydown', handleKeyboardSave);
  });

  return { handleConfirmCreateSaves, handleCreateSaves, handleExportSaves };
}
