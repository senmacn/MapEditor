<template>
  <a-config-provider :locale="zhCN">
    <titlebar v-if="isLocal()" />
    <div :class="['ant-vue-site', isLocal() ?? 'is-local']">
      <router-view />
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
  import Titlebar from '@/components/titlebar/titlebar.vue';
  import zhCN from 'ant-design-vue/es/locale/zh_CN';
  import { isLocal } from '@/utils/env';
</script>

<style lang="less">
  .ant-vue-site {
  }
</style>
