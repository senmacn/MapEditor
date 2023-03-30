<template>
  <div class="arco-vue-site">
    <navbar />
    <div class="arco-vue-body">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
  import Navbar from './components/navbar/index.vue';
  import modal from '@arco-design/web-vue/es/modal';
  import { onBeforeUnmount, onMounted } from 'vue';

  function F5Check(e: KeyboardEvent) {
    if (e.key === 'F5') {
      e.preventDefault();
      modal.confirm({
        title: '确认',
        content: '刷新页面可能会导致数据丢失，请确认您已保存数据！',
        onOk: () => {
          location.reload();
        },
      });
    }
  }
  // 挂载时初始化
  onMounted(() => {
    window.addEventListener('keydown', F5Check);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', F5Check);
  });
</script>

<style lang="less">
  .arco-vue-body {
    background-color: var(--color-fill-2);
  }
</style>
