<template>
  <a-config-provider :locale="zhCN">
    <div class="ant-vue-site">
      <router-view />
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
  import zhCN from 'ant-design-vue/es/locale/zh_CN';
</script>

<style lang="less">
  .ant-vue-site {
  }
</style>
