<template>
  <canvas id="pen-canvas"></canvas>
</template>

<script setup lang="ts">
  import useCanvas from './hooks/useCanvas';
  import controller, { CanvasOption } from './common/canvas-state-controller';
  import { onMounted, watch } from 'vue';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import Pen from './pen/Pen';

  defineProps({
    offset: {
      type: Object as PropType<Offset>,
      default: { x: 0, y: 0 },
    },
  });

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
    const flag = configRef.size.x > 5000 || configRef.size.y > 5000;
    maskCanvas.width = flag ? 5000 : configRef.size.x;
    maskCanvas.height = flag ? 5000 : configRef.size.y;
    let ctx = maskCanvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    ctxRef.setupCanvas(ctx);
  });

  // zoom配置修改时，修改canvas大小
  // watch(
  //   () => configRef.zoom,
  //   () => {
  //     if (configRef.zoom) {
  //       const maskCanvas = document.getElementById('pen-canvas');
  //       if (!maskCanvas) return;
  //       const style = canvasUtil.getZoomChangeStyle(configRef.zoom);
  //       maskCanvas.style.setProperty('transform', style.transform);
  //       maskCanvas.style.setProperty('top', style.top);
  //       maskCanvas.style.setProperty('left', style.left);
  //     }
  //   },
  // );
</script>

<style scoped lang="less">
  #pen-canvas {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 999;
    /* border: 1px dotted black; */
  }
</style>
