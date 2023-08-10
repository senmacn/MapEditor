<template>
  <canvas id="pen-canvas"></canvas>
</template>

<script setup lang="ts">
  import useCanvas from './hooks/useCanvas';
  import controller, { CanvasOption } from './common/canvas-state-controller';
  import { onBeforeUnmount, onMounted, watch } from 'vue';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import Pen from './pen/Pen';

  // canvas相关
  const ctxRef = useCanvas();
  const configRef = useEditorConfig();

  watch(
    () => controller.getState(),
    (_, old) => {
      if (controller.getState() === CanvasOption.Pen) {
        ctxRef.clean();
        Pen.init();
        Pen.reset();
        Pen.active();
      } else {
        if (old === CanvasOption.Pen) {
          Pen.deactive();
        }
      }
    },
  );

  // 挂载时初始化
  onMounted(() => {
    let maskCanvas: HTMLCanvasElement | null = document.querySelector('#pen-canvas');
    if (maskCanvas == null) return;
    maskCanvas.width = configRef.getProjectSizeConfigPxWidth;
    maskCanvas.height = configRef.getProjectSizeConfigPxHeight;
    let ctx = maskCanvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    ctxRef.setupCanvas(ctx);
  });

  onBeforeUnmount(() => {
    Pen.deactive();

    ctxRef.destroy();
  });
</script>

<style scoped lang="less">
  #pen-canvas {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
  }
</style>
