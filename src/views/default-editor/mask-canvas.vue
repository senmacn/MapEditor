<template>
  <canvas
    id="maskCanvas"
    width="1000"
    height="1000"
    @mousemove="handleMouseMove"
    @mouseup.stop="handleMouseUp"
    @mousedown.stop="handleMouseDown"
    @mouseout="handleMouseOut"
  ></canvas>
</template>

<script setup lang="ts">
  import useCanvas from './hooks/useCanvas';
  import controller, { CanvasOption } from './common/canvas-options';
  import { getPos } from './common/canvas-util';
  import { onMounted } from 'vue';
  import { emitPersistLineEvent } from './common/event';

  // canvas相关
  const ctxRef = useCanvas();
  let beginPoint: PointA = { x: 0, y: 0 };
  let endPoint: PointA = { x: 0, y: 0 };

  // 鼠标事件根据不同按钮按下后分别处理
  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    switch (controller.getState()) {
      case CanvasOption.DrawLine: {
        const point = getPos(e);
        beginPoint = point;
        controller.setActive(true);
        break;
      }
      default:
        break;
    }
  }
  function handleMouseMove(e: MouseEvent) {
    if (e.button !== 0 || !controller.getActive()) return;
    switch (controller.getState()) {
      case CanvasOption.DrawLine: {
        ctxRef.clean();
        endPoint = getPos(e);
        ctxRef.drawDashLine(beginPoint, endPoint);
        break;
      }
      default:
        break;
    }
  }
  function handleMouseUp(e: MouseEvent) {
    switch (controller.getState()) {
      case CanvasOption.DrawLine: {
        endPoint = getPos(e);
        emitPersistLineEvent(beginPoint, endPoint);
        ctxRef.clean();
        break;
      }
      default:
        break;
    }
    controller.setActive(false);
  }
  function handleMouseOut(e: MouseEvent) {
    ctxRef.clean();
    controller.setActive(false);
  }

  // 挂载时初始化
  onMounted(() => {
    let maskCanvas: HTMLCanvasElement | null = document.querySelector('#maskCanvas');
    if (maskCanvas == null) return;
    let ctx = maskCanvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    ctxRef.setupCanvas(ctx);
  });
</script>

<style scoped lang="less">
  #maskCanvas {
    position: absolute;
    top: 0;
    left: 0;
    border: 5px solid #cccccc;
    background-repeat: no-repeat;
    background-size: contain;
    position: absolute;
  }
</style>
