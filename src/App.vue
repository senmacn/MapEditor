<template>
  <div class="arco-vue-site">
    <navbar />
    <div class="arco-vue-body">
      <router-view />
    </div>
    <a-back-top :style="{ right: '70px', bottom: '80px' }">
    </a-back-top>
  </div>
</template>

<script setup lang="ts">
  import ABackTop from '@arco-design/web-vue/es/back-top';
  import Navbar from './components/navbar/index.vue';
</script>

<style lang="less">
  .arco-vue-body {
    background-color: var(--color-fill-2);
  }
</style>
