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
</script>

<style lang="less">
  .arco-vue-body {
    background-color: #252526;
  }
</style>
