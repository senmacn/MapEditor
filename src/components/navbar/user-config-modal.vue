<template>
  <a-modal
    class="user-config-modal"
    :width="600"
    :visible="visible"
    @cancel="emit('close')"
    @ok="handleChange"
    :closable="false"
  >
    <div class="modal-title">用户设置</div>
    <div class="modal-content">
      <a-form size="small" :model="formModel" :labelCol="{ span: 6 }" :wrapperCol="{ span: 18 }" labelAlign="right">
        <a-form-item name="downloadLocation" label="坐标下载位置">
          <a-input v-if="isLocal()" v-model:value="formModel.downloadLocation" />
          <a-input v-else disabled placeholder="浏览器环境下此项配置不可用！" />
        </a-form-item>
        <a-form-item name="exportLocation" label="存档导出位置">
          <a-input v-if="isLocal()" v-model:value="formModel.exportLocation" />
          <a-input v-else disabled placeholder="浏览器环境下此项配置不可用！" />
        </a-form-item>
        <a-form-item name="colorExportLocation" label="色值图导出位置">
          <a-input v-if="isLocal()" v-model:value="formModel.colorExportLocation" />
          <a-input v-else disabled placeholder="浏览器环境下此项配置不可用！" />
        </a-form-item>
        <a-form-item name="colorExportLocation" label="UI图导出位置">
          <a-input v-if="isLocal()" v-model:value="formModel.uiExportLocation" />
          <a-input v-else disabled placeholder="浏览器环境下此项配置不可用！" />
        </a-form-item>
        <a-form-item name="colorExportLocation" label="远端服务器地址">
          <a-input v-if="isLocal()" v-model:value="formModel.remoteURL" />
          <a-input v-else disabled placeholder="浏览器环境下此项配置不可用！" />
        </a-form-item>
        <a-form-item name="autoSaveTime" label="自动保存时间" extra="值设置为0代表不自动保存">
          <div v-if="isLocal()">
            <a-input-number v-model:value="formModel.autoSaveTime" :max="30" :min="0" :step="1" />
            分钟
          </div>
          <a-input v-else disabled placeholder="浏览器环境下此项配置不可用！" />
        </a-form-item>
        <a-form-item
          name="useLatestConfig"
          label="自动保存配置"
          extra="启动后，新建项目时尺寸配置使用最后一次保存的数据"
        >
          <div v-if="isLocal()">
            <a-switch v-model:checked="formModel.useLatestConfig" />
          </div>
          <a-input v-else disabled placeholder="浏览器环境下此项配置不可用！" />
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import { useLocalState } from '@/store/modules/local-state';
  import { isLocal } from '@/utils/env';
  import { reactive } from 'vue';

  const emit = defineEmits<{
    (e: 'close'): void;
  }>();

  defineProps({
    visible: {
      type: Boolean,
      default: false,
    },
  });

  const localState = useLocalState();
  const formModel = reactive({
    exportLocation: localState.getExportLocation,
    downloadLocation: localState.getDownloadLocation,
    colorExportLocation: localState.getColorExportLocation,
    uiExportLocation: localState.getUIExportLocation,
    remoteURL: localState.getRemoteURL,
    autoSaveTime: localState.getAutoSaveTime,
    useLatestConfig: localState.getUseLatestConfig,
  });

  function handleChange() {
    localState.setUserConfig({
      exportLocation: formModel.exportLocation,
      downloadLocation: formModel.downloadLocation,
      colorExportLocation: formModel.colorExportLocation,
      uiExportLocation: formModel.uiExportLocation,
      remoteURL: formModel.remoteURL,
      autoSaveTime: formModel.autoSaveTime,
      useLatestConfig: formModel.useLatestConfig,
    });
    emit('close');
  }
</script>

<style lang="less">
  .user-config-modal {
    .ant-form {
      padding: 0 20px;
    }
  }
</style>
