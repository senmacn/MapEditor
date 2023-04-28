<template>
  <nav class="arco-nav">
    <div class="arco-nav-logo">
      <img src="../../assets/images/map.png" width="32" />
      <span>地图编辑器</span>
    </div>
    <div class="arco-nav-right">
      <a-space size="large">
        <a-tooltip
          content="
            全屏
          "
        >
          <a-button class="nav-btn" type="outline" :shape="'circle'" @click="toggleFullScreen">
            <template #icon>
              <icon-fullscreen-exit v-if="isFullscreen" />
              <icon-fullscreen v-else />
            </template>
          </a-button>
        </a-tooltip>
        <a-avatar :size="36" :image-url="defaultAvatar"></a-avatar>
      </a-space>
    </div>
  </nav>
</template>

<script setup lang="ts">
  import { useFullscreen } from '@vueuse/core';
  import defaultAvatar from '@/assets/images/defaultAvatar.png';

  const { isFullscreen, toggle: toggleFullScreen } = useFullscreen();
</script>

<style scoped lang="less" src="./style.less" />
