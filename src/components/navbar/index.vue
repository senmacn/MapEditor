<template>
  <nav class="arco-nav">
    <div class="arco-nav-logo">
      <img src="../../assets/images/map.png" width="32" />
      <span>地图编辑器</span>
    </div>
    <div class="arco-nav-right">
      <a-space size="large">
        <a-select v-model="routerRef">
          <!-- <a-option :value="RouterEnum.GridEditor">
            <router-link to="/grid-editor"> 网格编辑器 </router-link>
          </a-option> -->
          <a-option :value="RouterEnum.DefaultEditor">
            <router-link to="/default-editor"> 默认编辑器 </router-link>
          </a-option>
        </a-select>
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
  import { onMounted, ref } from 'vue';
  import defaultAvatar from '@/assets/images/defaultAvatar.png';

  enum RouterEnum {
    DefaultEditor = 'default-editor',
  }

  const { isFullscreen, toggle: toggleFullScreen } = useFullscreen();

  const routerRef = ref(RouterEnum.DefaultEditor);
  onMounted(() => {
    const href = location.href;
    if (href.includes(RouterEnum.DefaultEditor)) {
      routerRef.value = RouterEnum.DefaultEditor;
    }
    if (href.includes(RouterEnum.DefaultEditor)) {
      routerRef.value = RouterEnum.DefaultEditor;
    }
  });
</script>

<style scoped lang="less" src="./style.less" />
