<template>
  <nav class="ant-nav" :style="{ top: isLocal() ? '30px' : 0 }">
    <div class="ant-nav-logo" v-if="!isLocal()">
      <img src="../../assets/icons/map.svg" width="32" />
      <span>地图编辑器</span>
    </div>
    <div v-else class="ant-nav-left">
      <!-- <a-dropdown trigger="hover">
        文件
        <template #overlay>
          <a-menu>
            <a-menu-item key="1">
              <a-button>保存</a-button>
            </a-menu-item>
            <a-menu-item key="2">
              <a-button>导出</a-button>
            </a-menu-item>
            <a-menu-item key="3">
              <a-button>加载</a-button>
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown> -->
    </div>
    <div class="ant-nav-right">
      <a-space size="large">
        <a-tooltip>
          <a-button class="nav-btn" shape="round" @click="handleOpenConfig">
            <template #icon>
              <setting-outlined></setting-outlined>
            </template>
          </a-button>
        </a-tooltip>
        <a-tooltip
          title="
            全屏
          "
        >
          <a-button class="nav-btn" shape="round" @click="toggleFullScreen">
            <template #icon>
              <fullscreen-exit-outlined v-if="isFullscreen" />
              <fullscreen-outlined v-else />
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
  import { useFullscreen } from '@vueuse/core';
  import defaultAvatar from '@/assets/images/defaultAvatar.png';
  import { isLocal } from '@/utils/env';
  import {
    FullscreenOutlined,
    FullscreenExitOutlined,
    SettingOutlined,
  } from '@ant-design/icons-vue';
  import UserConfigModal from './user-config-modal.vue';
  import { ref } from 'vue';

  const { isFullscreen, toggle: toggleFullScreen } = useFullscreen();

  const userConfigModalVisibleRef = ref();
  function handleOpenConfig() {
    userConfigModalVisibleRef.value = true;
  }
</script>

<style scoped lang="less" src="./style.less" />
