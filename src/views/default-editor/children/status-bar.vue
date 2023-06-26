<template>
  <div class="status-bar">
    <div class="wrapper">
      <div class="status-col"> 地图大小 [{{ mapSize }}] </div>
      <div> 状态 [{{ statusRef }}] </div>
      <div> <drag-outlined /> {{ pos }} </div>
    </div>
    <controlled-slider @register="registerControllerSlider"></controlled-slider>
  </div>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted } from 'vue';
  import controller from '../common/canvas-state-controller';
  import { useMouse } from '@vueuse/core';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import { DragOutlined } from '@ant-design/icons-vue';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import ControlledSlider, { useControllerSlider } from '@/components/controlled-slider';

  const configRef = useEditorConfig();

  const statusRef = computed(() => {
    return controller.isDrawingArea()
      ? '区域编辑<' + (controller.getCurrentAreas()[0]?.getName() || 'newArea') + '>'
      : '区域查看';
  });

  const computedPos = computed(() => {
    return (value) =>
      Math.floor(
        configRef.getMapSize.used
          ? configRef.getMapSize.ltX + value * configRef.getSize.scale
          : value,
      );
  });

  const state = useCanvasState();
  const mouseRef = useMouse();
  const pos = computed(() => {
    let pureX = Number(mouseRef.x.value) + state.getOffset.x - 23;
    let pureY = Number(mouseRef.y.value) + state.getOffset.y - 76;
    if (pureX < 0 || pureY < 0) return `x: ${computedPos.value(0)}   y: ${computedPos.value(0)}`;
    return `x: ${computedPos.value(pureX)}   y: ${computedPos.value(pureY)}`;
  });

  const mapSize = computed(() => {
    const x = configRef.getMapSize.rbX - configRef.getMapSize.ltX;
    const y = configRef.getMapSize.rbY - configRef.getMapSize.ltY;
    return `${x} X ${y}`;
  });

  const [registerControllerSlider, { zoomIn, zoomOut }] = useControllerSlider({
    onChange: function (val) {
      configRef.setZoom(val);
    },
  });
  function handleKeyBoardDown(e: KeyboardEvent) {
    if (e.key === '=' && e.ctrlKey) {
      zoomIn();
      e.stopPropagation();
      e.preventDefault();
    }
    if (e.key === '-' && e.ctrlKey) {
      zoomOut();
      e.stopPropagation();
      e.preventDefault();
    }
  }
  onMounted(() => {
    document.body.addEventListener('keydown', handleKeyBoardDown);
  });
  onBeforeUnmount(() => {
    document.body.removeEventListener('keydown', handleKeyBoardDown);
  });
</script>

<style lang="less">
  .status-bar {
    display: flex;
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
    flex: 1;
    font-size: 12px;
    border-right: 1px solid rgb(235, 235, 235);
    > div {
      padding: 0 10px;
      min-width: 150px;
      border-right: 1px solid rgb(235, 235, 235);
    }
    .anticon {
      margin-right: 10px;
    }
    .status-col {
      width: 180px;
    }
  }
</style>
