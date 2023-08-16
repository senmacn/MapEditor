<template>
  <div class="custom-page">
    <div class="custom-wrapper">
      <div class="custom-title"> 通用设置 </div>
      <div class="custom-content">
        <a-checkbox
          v-model:checked="customSettingRef.openProjectInNewWindow"
          @change="(e) => handleSettingChange(e, 'openProjectInNewWindow')"
        >
          打开项目在新窗口显示
        </a-checkbox>
      </div>
    </div>
    <div class="custom-wrapper">
      <div class="custom-title"> 颜色方案 </div>
      <div class="custom-content"> </div>
    </div>
    <div class="custom-wrapper">
      <div class="custom-title"> 按键映射启用 </div>
      <div class="custom-content">
        <a-checkbox
          v-model:checked="customSettingRef.ctrlSSaveProject"
          @change="(e) => handleSettingChange(e, 'ctrlSSaveProject')"
        >
          CTRL + S 快速保存项目
        </a-checkbox>
      </div>
    </div>
    <div class="custom-wrapper">
      <div class="custom-title"> Beta </div>
      <div class="custom-content">
        <a-checkbox
          v-model:checked="customSettingRef.closeCPUAcceleration"
          @change="(e) => handleSettingChange(e, 'closeCPUAcceleration')"
        >
          禁用GPU和硬件加速
        </a-checkbox>
        <a-button class="tools" @click="localApi?.clearCache()"> 清除缓存 </a-button>
        <a-button class="tools" @click="localApi?.openDevTools()"> 开发者工具 </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive } from 'vue';
  import { getLocalApi } from '@/utils/env';
  import { Modal } from 'ant-design-vue';

  const localApi = getLocalApi();

  const customSettingRef = reactive({
    openProjectInNewWindow: false,
    ctrlSSaveProject: false,
    closeCPUAcceleration: false,
  });

  async function handleSettingChange(e, key) {
    if (localApi) {
      await localApi.setCustomConfig(key, e.target.checked);
      if (key === 'closeCPUAcceleration') {
        Modal.confirm({
          title: '重启',
          content: '修改【禁用GPU和硬件加速】后需要重启应用才能生效，是否立即重启？',
          type: 'warning',
          okText: '重启',
          cancelText: '稍后重启',
          onOk: () => {
            localApi.relaunch();
          },
        });
      }
    }
  }

  onMounted(async () => {
    if (localApi) {
      const setting = await localApi.getCustomConfig();
      Object.keys(setting).forEach((key) => {
        if (Reflect.has(customSettingRef, key)) {
          Reflect.set(customSettingRef, key, setting[key]);
        }
      });
    }
  });
</script>

<style lang="less">
  .custom-page {
    padding: 30px;
    user-select: none;
    .custom-wrapper {
      margin-bottom: 30px;
    }
    .custom-title {
      font-size: 16px;
    }
    .custom-content {
      display: flex;
      flex-direction: column;
      padding: 10px;
      > * {
        margin-bottom: 10px;
      }
    }
    .tools {
      width: auto;
      font-size: 12px;
      background: #333333;
      &:hover {
        color: white;
        background: #444444;
      }
    }
  }
</style>
