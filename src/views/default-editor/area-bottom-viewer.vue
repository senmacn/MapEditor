<template>
  <div
    class="layer-instance bottom-layer"
    :style="style"
    @mousedown="handleClickOutAreaBefore"
    @mouseup="handleClickOutArea"
  ></div>
</template>

<script setup lang="ts">
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { isString } from 'lodash-es';
  import controller from './common/canvas-state-controller';

  const configRef = useEditorConfig();
  const style = `width: ${configRef.size.x}px; height: ${configRef.size.y}px;`;

  const mouseDown = [0, 0];
  function handleClickOutAreaBefore(e: MouseEvent) {
    if (!e.isTrusted) return;
    mouseDown[0] = e.x;
    mouseDown[1] = e.y;
  }
  function handleClickOutArea(e: MouseEvent) {
    if (!e.isTrusted) return;
    // 区分点击/拖拽
    if (Math.abs(mouseDown[0] - e.x) + Math.abs(mouseDown[1] - e.y) > 5) return;
    const target = e.target as HTMLElement;
    // 区分点击空白处和区域(排除svg点击干扰)
    if (isString(target.className) && target.className.includes('layer-instance')) {
      if (controller.getCurrentAreas().length) {
        controller.getCurrentAreas().forEach((area) => {
          area.cancelSelect();
        });
        controller.setCurrentAreas([]);
      }
      controller.getCurrentPin()?.cancelSelect();
      // 这里只处理点击区域外的逻辑
      controller.setCurrentPin(null);
    } else {
      const id = target.id;
      // 点击到非选中区域
      const areas = controller.getCurrentAreas();
      if (areas.length && !areas.some((area) => area.getUuid() === id)) {
        controller.getCurrentAreas().forEach((area) => area.cancelSelect());
        controller.getCurrentPin()?.cancelSelect();
        controller.setCurrentAreas([]);
        controller.setCurrentPin(null);
      }
    }
  }
</script>

<style>
  .layer-instance.bottom-layer {
    pointer-events: auto;
  }
</style>
