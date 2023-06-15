<template>
  <div :class="['ant-vue-body', isLocal() ? 'is-local' : '']">
    <navbar>
      <navbar-options></navbar-options>
    </navbar>
    <edit-options></edit-options>
    <default-editor></default-editor>
  </div>
</template>

<script setup lang="ts">
  import Navbar from '@/components/navbar/index.vue';
  import NavbarOptions from './navbar-options.vue';
  import DefaultEditor from './default-editor.vue';
  import modal from 'ant-design-vue/lib/modal';
  import { onBeforeUnmount, onMounted } from 'vue';
  import EditOptions from './children/edit-options.vue';
  import { isLocal } from '@/utils/env';

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

<style></style>
