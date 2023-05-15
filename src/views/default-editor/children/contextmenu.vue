<template>
  <v-contextmenu ref="contextmenu">
    <v-contextmenu-item> 跳转到UE5 </v-contextmenu-item>
    <v-contextmenu-divider />
    <v-contextmenu-item @click="handleInsertPin">
      <icon-pushpin />
      插入地图钉
    </v-contextmenu-item>
    <v-contextmenu-item @click="handleEditPin">
      <icon-edit />
      修改地图钉
    </v-contextmenu-item>
    <v-contextmenu-item @click="handleEditPin">
      <icon-edit />
      删除地图钉
    </v-contextmenu-item>
    <v-contextmenu-divider />
    <v-contextmenu-item> </v-contextmenu-item>
    <v-contextmenu-item> </v-contextmenu-item>
  </v-contextmenu>
</template>

<script setup lang="ts">
  import { inject, ref } from 'vue';

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

  defineExpose({
    show: handleShowContextMenu,
    hide: handleHideContextMenu,
  });
</script>

<style lang="less"></style>
