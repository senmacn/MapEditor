<template>
  <nav class="ant-nav" :style="{ top: isLocal() ? '30px' : 0 }">
    <div class="ant-nav-left">
      <slot></slot>
    </div>
    <div class="ant-nav-right">
      <a-space size="large">
        <a-tooltip title="说明文档">
          <a-button class="nav-btn" shape="round" @click="handleGotoQuestion">
            <template #icon>
              <QuestionCircleOutlined />
            </template>
          </a-button>
        </a-tooltip>
        <a-tooltip>
          <a-button class="nav-btn" shape="round" @click="handleOpenConfig">
            <template #icon>
              <setting-outlined></setting-outlined>
            </template>
          </a-button>
        </a-tooltip>
        <a-avatar :size="36" :src="defaultAvatar"></a-avatar>
      </a-space>
    </div>
    <user-config-modal
      :visible="userConfigModalVisibleRef"
      @close="userConfigModalVisibleRef = false"
    />
  </nav>
</template>

<script setup lang="ts">
  import defaultAvatar from '@/assets/images/defaultAvatar.png';
  import { isLocal, getLocalApi } from '@/utils/env';
  import { SettingOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue';
  import UserConfigModal from './user-config-modal.vue';
  import { ref } from 'vue';

  const href = 'https://docs.oa.wanmei.net/kdocs/l/cgpQRPmL23TQ';

  function handleGotoQuestion() {
    if (isLocal()) {
      getLocalApi()?.newWindow(href, true);
    } else {
      // TODO: 解决419报错
      const element = document.createElement('a');
      element.href = href;
      const a = document.body.appendChild(element);
      a.setAttribute('target', '_blank');
      a.click();
      document.body.removeChild(element);
    }
  }

  const userConfigModalVisibleRef = ref();
  function handleOpenConfig() {
    userConfigModalVisibleRef.value = true;
  }
</script>

<style scoped lang="less" src="./style.less" />
