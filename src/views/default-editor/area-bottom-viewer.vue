<template>
  <div
    id="bottom-layer"
    class="layer-instance bottom-layer"
    @mousedown="handleClickOutAreaBefore"
    @mouseup="handleClickOutArea"
  ></div>
</template>

<script setup lang="ts">
  import { isString } from 'lodash-es';
  import controller from './common/canvas-state-controller';
  import { Area } from './draw-element';
  import { message } from 'ant-design-vue';
  import { onMounted, onBeforeUnmount } from 'vue';
  import { copyImageData } from './utils/image-data-util';
  import { useCanvasState } from '@/store/modules/canvas-state';

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
      // 这里只处理点击区域外的逻辑
      controller.getCurrentPin()?.cancelSelect();
      controller.setCurrentPin(null);
      controller.getCurrentPathway()?.cancelSelect();
      controller.setCurrentPathway(null);
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

  const state = useCanvasState();
  let copyAreas: Area[] = [];
  function handleCopyPasteArea(e: KeyboardEvent) {
    if (e.ctrlKey && e.isTrusted) {
      if (e.key === 'c') {
        if (controller.getCurrentAreas().length > 0) {
          copyAreas = controller.getCurrentAreas().slice() as Area[];
          message.info('复制成功！');
        }
      }
      if (e.key === 'v') {
        if (copyAreas.length) {
          const uuids = copyAreas.map((area) => area.getUuid()).join(',');
          state.getLayers.forEach((layer) => {
            for (const index in layer.areas) {
              const area = layer.areas[index];
              if (uuids.includes(area.getUuid())) {
                // 偏移防止重叠
                const newBoundRect = Object.assign({}, area.getBoundRect()) as Box;
                newBoundRect[0] = newBoundRect[0] + Math.floor(newBoundRect[2] / 10);
                newBoundRect[1] = newBoundRect[1] + Math.floor(newBoundRect[3] / 10);
                // 考虑偏移
                newBoundRect[2] = newBoundRect[2] * area.scale;
                newBoundRect[3] = newBoundRect[3] * area.scale;
                const newArea = new Area(area.getName() + '_拷贝', copyImageData(area.getData()), newBoundRect);
                newArea.layer = layer;
                layer.areas.splice(Number(index) + 1, 0, newArea);
                state.getAreaMap.set(newArea.getUuid(), newArea);
              }
            }
          });
          // 清空选中
          controller.getCurrentAreas().forEach((area) => area.cancelSelect());
          controller.setCurrentAreas([]);
          message.info('粘贴成功！');
        }
      }
      if (e.key === 'z' && !controller.isDrawing()) {
        controller.revertAction(state);
      }
    }
  }
  // 挂载时初始化
  onMounted(() => {
    document.body.addEventListener('keydown', handleCopyPasteArea);
  });
  onBeforeUnmount(() => {
    document.body.removeEventListener('keydown', handleCopyPasteArea);
  });
</script>

<style>
  .layer-instance.bottom-layer {
    background-color: #333;
    pointer-events: auto;
  }
</style>
