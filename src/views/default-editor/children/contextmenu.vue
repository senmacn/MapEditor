<template>
  <v-contextmenu ref="contextmenu">
    <!-- <v-contextmenu-item :disabled="true">
      <link-outlined />
      跳转到[UE]
    </v-contextmenu-item>
    <v-contextmenu-divider /> -->
    <v-contextmenu-item @click="handleDrawArea">
      <plus-outlined />
      新增区域
    </v-contextmenu-item>
    <v-contextmenu-item @click="handleDrawAreaBaseOnChoose" :disabled="!selectedAreaRef">
      <appstore-add-outlined />
      基于选中区域新增
    </v-contextmenu-item>
    <!-- <v-contextmenu-item @click="handleEditArea">
      <edit-outlined />
      修改区域
    </v-contextmenu-item> -->
    <v-contextmenu-item @click="handleDeleteArea" :disabled="!selectedAreaRef">
      <delete-outlined />
      删除区域
    </v-contextmenu-item>
    <v-contextmenu-divider />
    <v-contextmenu-item @click="handleInsertPin">
      <pushpin-outlined />
      插入地图钉
    </v-contextmenu-item>
    <v-contextmenu-item @click="handleEditPin" :disabled="!selectedPinRef">
      <edit-outlined />
      修改地图钉
    </v-contextmenu-item>
    <v-contextmenu-item @click="handleDeletePin" :disabled="!selectedPinRef">
      <delete-outlined />
      删除地图钉
    </v-contextmenu-item>
  </v-contextmenu>
</template>

<script setup lang="ts">
  import { computed, inject, ref } from 'vue';
  import {
    // LinkOutlined,
    PlusOutlined,
    AppstoreAddOutlined,
    PushpinOutlined,
    EditOutlined,
    DeleteOutlined,
  } from '@ant-design/icons-vue';
  import { emitDeleteAreaEvent, emitEditAreaEvent } from '../common/event';
  import { Modal } from 'ant-design-vue';
  import controller from '../common/canvas-state-controller';

  const emit = defineEmits<{
    (e: 'show-pin-modal', create: boolean): void;
  }>();

  function handleDrawArea() {
    controller.startDrawingArea(true);
  }

  function handleDrawAreaBaseOnChoose() {
    controller.startDrawingArea(true);
    setTimeout(() => {
      emitEditAreaEvent();
    }, 30);
  }

  function handleDeleteArea() {
    if (!controller.getCurrentAreas().length) {
      return;
    }
    Modal.confirm({
      title: '提醒',
      content: '删除当前选中的区域？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        emitDeleteAreaEvent();
      },
    });
  }

  const selectedAreaRef = computed(() => controller.getCurrentAreas().length > 0);
  const selectedPinRef = computed(() => controller.getCurrentPin() !== null);

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

  function handleDeletePin() {
    if (!controller.getCurrentPin()) {
      return;
    }
    const pinToDelete = controller.getCurrentPin();
    Modal.confirm({
      title: '提醒',
      content: '确定要删除选中的点吗？',
      okText: '确定',
      cancelText: '取消',
      onOk() {
        const posIndex = pinToDelete?.layer?.pins.findIndex((value) =>
          value.isSame(pinToDelete),
        ) as number;
        if (posIndex > -1) {
          pinToDelete?.layer?.pins.splice(posIndex, 1);
        }
        controller.setCurrentPin(null);
        setTimeout(() => {
          pinToDelete?.destroy();
        });
      },
    });
  }

  defineExpose({
    show: handleShowContextMenu,
    hide: handleHideContextMenu,
  });
</script>

<style lang="less"></style>
