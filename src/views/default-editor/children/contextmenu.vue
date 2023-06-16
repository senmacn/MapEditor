<template>
  <v-contextmenu ref="contextmenu">
    <v-contextmenu-item>
      <link-outlined />
      跳转到[UE]
    </v-contextmenu-item>
    <v-contextmenu-divider />
    <v-contextmenu-item @click="handleInsertPin">
      <pushpin-outlined />
      插入地图钉
    </v-contextmenu-item>
    <v-contextmenu-item @click="handleEditPin">
      <edit-outlined />
      修改地图钉
    </v-contextmenu-item>
    <v-contextmenu-item @click="handleDeletePin">
      <delete-outlined />
      删除地图钉
    </v-contextmenu-item>
  </v-contextmenu>
</template>

<script setup lang="ts">
  import { inject, ref } from 'vue';
  import {
    LinkOutlined,
    PushpinOutlined,
    EditOutlined,
    DeleteOutlined,
  } from '@ant-design/icons-vue';

  const emit = defineEmits<{
    (e: 'show-pin-modal', create: boolean): void;
  }>();

  const clickPositionRef = inject<PointA>('clickPositionRef');

  function handleInsertPin() {
    emit('show-pin-modal', true);
  }

  function handleEditPin() {
    emit('show-pin-modal', false);
  }

  const contextmenu = ref();
  function handleShowContextMenu() {
    contextmenu.value.show({ top: clickPositionRef?.y, left: clickPositionRef?.x });
  }

  function handleHideContextMenu() {
    contextmenu.value.hide();
  }

  function handleDeletePin() {}

  defineExpose({
    show: handleShowContextMenu,
    hide: handleHideContextMenu,
  });
</script>

<style lang="less"></style>
