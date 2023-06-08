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
      <a-button type="primary" :disabled="!isLocal()" @click="handleCreateSaves"> 保存 </a-button>
    </a-col>
    <a-col :span="6">
      <a-button type="primary" @click="handleExportSaves"> 导出 </a-button>
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
</template>

<script setup lang="ts">
  import { Ref, inject, ref } from 'vue';
  import modal from 'ant-design-vue/lib/modal';
  import ChangeMapSizeModal from './change-map-size-modal.vue';
  import DisplayOutputModal from './display-output-modal.vue';
  import { Layer } from '../common/types';
  import { useLoading } from '@/components/Loading';
  import { exportFile } from '@/utils/file';
  import { createSaves } from '@/utils/persist';
  import { getFormatDate } from '@/utils/date';
  import { getLocalApi, isLocal } from '@/utils/env';
  import { message } from 'ant-design-vue';
  import { useLocalState } from '@/store/modules/local-state';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { loadSaves } from '@/utils/persist';

  const emit = defineEmits<{
    (e: 'load-saves', layers: any): void;
  }>();

  const localState = useLocalState();
  const configRef = useEditorConfig();
  const layersRef: Ref<Layer[]> = inject('layers', [] as any);

  const localApi = getLocalApi();
  function handleCreateSaves() {
    modal.confirm({
      title: '确认',
      content: '保存当前编辑的数据存档？',
      onOk: () => {
        try {
          const fileName =
            localState.getFileName ||
            `map_data_${configRef.getSize.x}x${configRef.getSize.y}.${getFormatDate(
              new Date(),
              'MM-dd_hh-mm',
            )}.json`;
          localApi &&
            localApi.saveLocalFile(
              fileName,
              createSaves([configRef.getSize.x, configRef.getSize.y], layersRef.value),
            );
          localState.setFileName(fileName);
        } catch (_err) {
          console.warn(_err);
        }
      },
    });
  }

  function handleExportSaves() {
    modal.confirm({
      title: '确认',
      type: 'confirm',
      content: '导出当前编辑的数据存档？',
      onOk: () => {
        openLoadLoading();
        const fileName = `map_data_${configRef.getSize.x}x${configRef.getSize.y}.${getFormatDate(
          new Date(),
          'MM-dd_hh-mm',
        )}.json`;
        const data = createSaves([configRef.getSize.x, configRef.getSize.y], layersRef.value);
        if (localApi) {
          localApi
            .saveLocalFile(fileName, data, localState.getExportLocation)
            .then((e) => {
              if (e) {
                message.error('导出失败！');
              }
            })
            .finally(() => {
              setTimeout(() => closeLoadLoading(), 100);
            });
        } else {
          exportFile(fileName, data, 'json');
          setTimeout(() => closeLoadLoading(), 100);
        }
      },
    });
  }

  const [openLoadLoading, closeLoadLoading] = useLoading({ tip: '加载中！', minTime: 2000 });
  function handleLoadSaves(file: File) {
    openLoadLoading();
    var reader = new FileReader(); //调用FileReader
    reader.readAsText(file); //将文件读取为 text
    reader.onload = function (evt) {
      _handleExecutionSave(String(evt.target?.result));
      closeLoadLoading();
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
</script>

<style lang="less"></style>
