<template>
  <a-row class="option-group" style="height: 100px">
    <a-col class="row-label" :span="4">
      <span class="group-label">文件： </span>
    </a-col>
    <a-col :span="6">
      <a-button type="primary" @click="handleChangeMapSize">尺寸设置</a-button>
    </a-col>
    <a-col :span="6">
      <a-button type="primary" @click="displayOutputVisibleRef = true">下载坐标</a-button>
    </a-col>
    <a-col :span="6" :offset="4">
      <a-button type="primary" :disabled="!isLocal()" @click="handleConfirmCreateSaves">
        保存
      </a-button>
    </a-col>
    <a-col :span="6">
      <a-button type="primary" @click="handleOpenExportModal"> 导出 </a-button>
    </a-col>
    <a-col :span="6">
      <a-upload
        :before-upload="(file) => handleLoadSaves(file)"
        accept=".json"
        :showUploadList="false"
      >
        <a-button type="primary">加载</a-button>
      </a-upload>
    </a-col>
  </a-row>
  <change-map-size-modal
    :visible="changeMapSizeModalVisible"
    @close="changeMapSizeModalVisible = false"
  />
  <display-output-modal :visible="displayOutputVisibleRef" @cancel="handleConfirmCancelExport" />
  <export-modal :visible="exportModalRef" :layers="canvasState.layers" @emit-close-export="handleCloseExport" @emit-format-exp-data="handleFormatExpData" />
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue';
  import modal from 'ant-design-vue/lib/modal';
  import ChangeMapSizeModal from './change-map-size-modal.vue';
  import DisplayOutputModal from './display-output-modal.vue';
  import ExportModal from './export-modal.vue';
  import { useLoading } from '@/components/Loading';
  import { exportFile } from '@/utils/file';
  import { createSaves } from '@/utils/persist';
  import { getFormatDate } from '@/utils/date';
  import { getLocalApi, isLocal } from '@/utils/env';
  import { message } from 'ant-design-vue';
  import { useLocalState } from '@/store/modules/local-state';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { loadSaves } from '@/utils/persist';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import { Layer } from '@/views/default-editor/common/types';

  const emit = defineEmits<{
    (e: 'load-saves', layers: any): void;
  }>();

  const localState = useLocalState();
  const configRef = useEditorConfig();
  const canvasState = useCanvasState();

  const localApi = getLocalApi();
  function handleConfirmCreateSaves() {
    modal.confirm({
      title: '确认',
      content: '保存当前编辑的数据存档？',
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
        localApi.saveLocalFile(
          fileName,
          createSaves([configRef.getSize.x, configRef.getSize.y], canvasState.layers),
        );
        localState.setFileName(fileName);
      }
    } catch (_err) {
      message.error('保存失败！');
      console.warn(_err);
      throw new Error();
    }
  }

  const exportModalRef = ref(false);
  function handleExportSaves(expLayer) {
    console.log('canvasState.layers', canvasState.layers)
    console.log('expLayer', expLayer)
    modal.confirm({
      title: '确认',
      type: 'confirm',
      content: '导出当前编辑的数据存档？',
      onOk: () => {
        openLoading();
        const fileName = `map_data_${configRef.getSize.x}x${configRef.getSize.y}.${getFormatDate(
          new Date(),
          'MM-dd_hh-mm',
        )}.json`;
        const data = createSaves([configRef.getSize.x, configRef.getSize.y], expLayer);
        if (localApi) {
          localApi
            .saveLocalFile(fileName, data, localState.getExportLocation)
            .then((e) => {
              if (e) {
                message.error('导出失败！');
              }
            })
            .finally(() => {
              setTimeout(() => closeLoading(), 100);
            });
        } else {
          exportFile(fileName, data, 'json');
          setTimeout(() => closeLoading(), 100);
        }
      },
    });
  }
  function handleOpenExportModal() {
    exportModalRef.value = true;
  }
  function handleCloseExport() {
    exportModalRef.value = false;
  }
  function handleFormatExpData(data: any) {
    const { layers, areas } = data
    const expLayerAreaData: any = []
    for(let i = 0; i < layers.length; i+= 1) {
      expLayerAreaData.push({
        ...canvasState.layers.slice(layers[i], layers[i] + 1)[0], 
        areas: []
      })
    }
    for(let i = 0; i < areas.length; i+= 1) {
      for(let j = 0; j < areas[i].length; j+= 1) {
        expLayerAreaData[i].areas.push(canvasState.layers[i].areas[areas[i][j]])
      }
    }
    handleExportSaves(expLayerAreaData)
  }
  const [openLoading, closeLoading] = useLoading({ tip: '加载中！', minTime: 1000 });
  function handleLoadSaves(file: File) {
    openLoading();
    var reader = new FileReader(); //调用FileReader
    reader.readAsText(file); //将文件读取为 text
    reader.onload = function (evt) {
      _handleExecutionSave(String(evt.target?.result));
      closeLoading();
    };
    return Promise.reject() as any;
  }
  function _handleExecutionSave(data) {
    try {
      const result = loadSaves(data, [configRef.getSize.x, configRef.getSize.y]);
      emit('load-saves', result?.layers);
    } catch (e: any) {
      message.warning({
        content: e.message,
        duration: 60000,
      });
    }
  }

  const displayOutputVisibleRef = ref(false);
  function handleConfirmCancelExport() {
    displayOutputVisibleRef.value = false;
  }

  const changeMapSizeModalVisible = ref(false);
  function handleChangeMapSize() {
    changeMapSizeModalVisible.value = true;
  }

  // 自动保存相关
  let endAutoSave: any = null;
  function handleAutoSave() {
    try {
      handleCreateSaves();
      message.success('自动保存成功！');
    } catch (_) {}
    endAutoSave = setTimeout(handleAutoSave, localState.getAutoSaveTime * 60 * 1000);
  }
  onMounted(() => {
    if (localState.getAutoSaveTime && isLocal()) {
      endAutoSave = setTimeout(handleAutoSave, localState.getAutoSaveTime * 60 * 1000);
    }
  });
  onUnmounted(() => {
    endAutoSave && clearTimeout(endAutoSave);
  });
</script>

<style lang="less"></style>
