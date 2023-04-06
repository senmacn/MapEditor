<template>
  <div class="status-bar">
    <div class="wrapper">
      <div class="status-col"> 状态: {{ statusRef }}</div>
      <div>
        <icon-drag-arrow />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import controller, { CanvasOption } from '../common/canvas-state-controller';

  const statusRef = computed(() => {
    return controller.isDrawingArea() ? '区域编辑' : '区域查看';
  });
</script>

<style lang="less">
  .status-bar {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 20px;
    line-height: 20px;
    padding: 0 15px;
    border-top: 1px solid rgb(235, 235, 235);
    background-color: var(--color-bg-1);
  }
  .status-bar .wrapper {
    display: flex;
    font-size: 12px;
    .status-col {
      width: 180px;
      border-right: 1px solid rgb(235, 235, 235);
    }
  }
</style>
