<template>
  <div class="status-bar">
    <div class="wrapper">
      <div class="status-col"> 状态: {{ statusRef }}</div>
      <div>
        <icon-drag-arrow />
      </div>
      <div> {{ pos }} </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import controller from '../common/canvas-state-controller';
  import { useMouse } from '@vueuse/core';

  const props = defineProps({
    offsetX: {
      type: Number,
      default: 0,
    },
    offsetY: {
      type: Number,
      default: 0,
    },
  });
  const mouseRef = useMouse();

  const statusRef = computed(() => {
    return controller.isDrawingArea()
      ? '区域编辑<' + (controller.getCurrentArea()?.getName() || 'newArea') + '>'
      : '区域查看';
  });

  const pos = computed(() => {
    let pureX = Number(mouseRef.x.value) + props.offsetX - 23;
    let pureY = Number(mouseRef.y.value) + props.offsetY - 76;
    if (pureX < 0 || pureY < 0) return 'x: 0   y: 0';
    return `x: ${pureX}   y: ${pureY}`;
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
    padding: 0 10px;
    color: white;
    background-color: rgb(0, 122, 204);
  }
  .status-bar .wrapper {
    display: flex;
    font-size: 12px;
    > div {
      padding: 0 10px;
      min-width: 100px;
      border-right: 1px solid rgb(235, 235, 235);
    }
    .status-col {
      width: 180px;
    }
  }
</style>
