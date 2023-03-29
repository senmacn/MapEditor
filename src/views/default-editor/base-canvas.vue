<template>
  <canvas
    :id="layer?.uuid"
    :style="canvasUtil.getZoomChangeStyle(configRef.zoom)"
    width="1000"
    height="1000"
  ></canvas>
</template>

<script setup lang="ts">
  import type { Layer } from './common/types';
  import { onMounted, watch } from 'vue';
  import { useCanvasConfigContext } from './hooks/useCanvasConfig';
  import useCanvas from './hooks/useCanvas';
  import * as canvasUtil from './common/canvas-util';

  const props = defineProps({
    layer: {
      type: Object as PropType<Layer>,
    },
  });

  watch(
    () => props.layer?.map,
    () => {
      if (props.layer) {
        const image = new Image();
        image.src = props.layer?.map as string;
        image.onload = () => {
          ctxRef.drawImage(image, 0, 0, ctxRef.canvas.width, ctxRef.canvas.height);
        };
      }
    },
  );
  watch(
    () => props.layer?.visible,
    () => {
      if (props.layer?.visible) {
        setTimeout(function () {
          setup();
        }, 100);
      }
    },
  );

  // canvas相关
  const ctxRef = useCanvas();
  const configRef = useCanvasConfigContext();
  // 初始化
  let setUpState = false;
  function setup() {
    if (!props.layer || setUpState) return;
    if (!props.layer) return;
    let editCanvas: HTMLCanvasElement = document.getElementById(
      props.layer.uuid,
    ) as HTMLCanvasElement;
    if (editCanvas == null) return;
    let ctx = editCanvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    ctxRef.setupCanvas(ctx, configRef);
    // drawCanvas();

    let CanvasWidth = ctxRef.canvas.width;
    let CanvasHeight = ctxRef.canvas.height;
    // 遍历的方式初始化网格
    ctxRef.beginPath();
    ctxRef.strokeStyle = '#ccc';
    ctxRef.lineWidth = 1;
    let xLineTotals = Math.floor(CanvasWidth / 12); // 计算需要绘画的x轴条数
    for (let i = 0; i < xLineTotals; i++) {
      ctxRef.moveTo(0, 12 * i);
      ctxRef.lineTo(CanvasWidth, 12 * i);
    }
    let yLineTotals = Math.floor(CanvasHeight / 12);
    for (let j = 0; j < yLineTotals; j++) {
      ctxRef.moveTo(12 * j, 0);
      ctxRef.lineTo(12 * j, CanvasHeight);
    }
    ctxRef.stroke();

    props.layer.ctx = ctxRef;
    setUpState = true;
  }

  // 配置修改时，重置canvas
  watch(
    () => configRef.zoom,
    () => {
      // drawCanvas();
    },
  );
  // 挂载时初始化
  onMounted(() => {
    setup();
  });
</script>

<style scoped lang="less">
  canvas {
    position: absolute;
    top: 0;
    left: 0;
    border: 3px solid rgb(143, 143, 143);
    background-repeat: no-repeat;
    background-size: contain;
  }
</style>
