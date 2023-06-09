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
      <a-form
        ref="pinFormRef"
        :model="formModel"
        :labelCol="{ span: 6 }"
        :wrapperCol="{ span: 18 }"
        labelAlign="right"
      >
        <a-form-item name="name" label="坐标下载位置">
          <a-input v-if="isLocal()" v-model:value="formModel.exportLocation" />
          <a-input v-else disabled placeholder="浏览器环境下此项配置不可用！" />
        </a-form-item>
        <a-form-item name="name" label="存档导出位置">
          <a-input v-if="isLocal()" v-model:value="formModel.downloadLocation" />
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
  });

  function handleChange() {
    localState.setDownloadLocation(formModel.downloadLocation);
    localState.setExportLocation(formModel.exportLocation);
    emit('close');
  }
</script>

<style lang="less">
  .user-config-modal {
    .ant-modal-body {
      padding: 0;
      border-radius: 4px;
    }
    .ant-form {
      width: 85%;
    }
    .ant-modal-footer {
      padding: 8px 10px;
      button {
        width: 80px;
        height: 32px;
      }
    }
  }
</style>
