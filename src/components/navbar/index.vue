<template>
  <nav class="arco-nav">
    <div class="arco-nav-logo">
      <img src="../../assets/images/map.png" width="32" />
      <span>地图编辑器</span>
    </div>
    <div class="arco-nav-right">
      <div>
        <a-select v-model="routerRef">
          <a-option :value="RouterEnum.GridEditor"><router-link to="/grid-editor"> 网格编辑器 </router-link></a-option>
          <a-option :value="RouterEnum.DefaultEditor"><router-link to="/default-editor"> 默认编辑器 </router-link></a-option>
        </a-select>
      </div>
      <div>
        <a-tool-tip
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
        </a-tool-tip>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
  import AToolTip from '@arco-design/web-vue/es/tooltip';
  import ASelect, { Option as AOption } from '@arco-design/web-vue/es/select';
  import AButton from '@arco-design/web-vue/es/button';
  import { useFullscreen } from '@vueuse/core';
  import { onMounted, ref } from 'vue';

  enum RouterEnum {
    GridEditor = "grid-editor",
    DefaultEditor = "default-editor"
  }

  const { isFullscreen, toggle: toggleFullScreen } = useFullscreen();

  const routerRef = ref(RouterEnum.GridEditor);
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
