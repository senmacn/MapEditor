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
        :model="formModel"
        :labelCol="{ span: 6 }"
        :wrapperCol="{ span: 18 }"
        labelAlign="right"
      >
        <a-form-item name="exportLocation" label="坐标下载位置">
          <a-input v-if="isLocal()" v-model:value="formModel.exportLocation" />
          <a-input v-else disabled placeholder="浏览器环境下此项配置不可用！" />
        </a-form-item>
        <a-form-item name="downloadLocation" label="存档导出位置">
          <a-input v-if="isLocal()" v-model:value="formModel.downloadLocation" />
          <a-input v-else disabled placeholder="浏览器环境下此项配置不可用！" />
        </a-form-item>
        <a-form-item name="autoSaveTime" label="自动保存时间">
          <div v-if="isLocal()">
            <a-input-number
              v-model:value="formModel.autoSaveTime"
              :max="30"
              :min="0"
              :step="1"
              placeholder="值为0时代表不自动保存"
            /> 分钟
          </div>

          <a-input v-else disabled placeholder="浏览器环境下此项配置不可用！" />
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import { useLocalState } from '@/store/modules/local-state';
  import { getLocalApi, isLocal } from '@/utils/env';
  import { onMounted, reactive } from 'vue';

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
    exportLocation: '',
    downloadLocation: '',
    autoSaveTime: 0,
  });

  function handleChange() {
    localState.setUserConfig({
      exportLocation: formModel.exportLocation,
      downloadLocation: formModel.downloadLocation,
      autoSaveTime: formModel.autoSaveTime,
    });
    emit('close');
  }

  onMounted(() => {
    // 本地环境下更新个人配置
    const localApi = getLocalApi();
    if (localApi) {
      localApi.getUserConfig().then((userConfig) => {
        useLocalState().setUserConfig(Object.assign({}, userConfig));
        Object.assign(formModel, userConfig);
      });
    }
  });
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
