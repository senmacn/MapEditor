import { useCanvasState } from '@/store/modules/canvas-state';
import { useEditorConfig } from '@/store/modules/editor-config';
import { useLocalState } from '@/store/modules/local-state';
import { getFormatDate } from '@/utils/date';
import { getLocalApi, isLocal } from '@/utils/env';
import { exportFile } from '@/utils/file';
import { createSaves } from '@/utils/persist';
import { message, Modal } from 'ant-design-vue';
import { debounce } from 'lodash-es';
import { onMounted, onUnmounted } from 'vue';

export default function useSaves() {
  const localApi = getLocalApi();
  const localState = useLocalState();
  const configRef = useEditorConfig();
  const canvasState = useCanvasState();

  function handleConfirmCreateSaves() {
    Modal.confirm({
      title: '确认',
      content: '保存当前编辑的数据存档？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        handleCreateSaves();
        message.success('保存成功！');
      },
    });
  }

  function handleCreateSaves() {
    try {
      const fileName =
        localState.getFileName !== '新建项目'
          ? localState.getFileName
          : `map_data_${configRef.getSize.x}x${configRef.getSize.y}.${getFormatDate(
              new Date(),
              'MM-dd_hh-mm',
            )}.json`;
      if (localApi) {
        localApi.saveLoads(fileName, createSaves(canvasState.getLayers));
        localState.setFileName(fileName);
      }
      return fileName;
    } catch (_err) {
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
      onOk: () => {
        const fileName = `map_data_${configRef.getSize.x}x${configRef.getSize.y}.${getFormatDate(
          new Date(),
          'MM-dd_hh-mm',
        )}.json`;
        const data = createSaves(expLayer);
        if (localApi) {
          localApi
            .saveLocalFile(fileName, data, localState.getExportLocation)
            .then((e) => {
              if (e) {
                message.error('导出失败！');
              }
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
      const config = await localApi?.getCustomConfig();
      if (config?.ctrlSSaveProject) {
        handleCreateSaves();
        message.success('保存成功！');
      }
    }
  }, 250);

  // 自动保存相关
  let endAutoSave: any = null;
  function handleAutoSave() {
    try {
      handleCreateSaves();
      message.success('自动保存成功！');
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
