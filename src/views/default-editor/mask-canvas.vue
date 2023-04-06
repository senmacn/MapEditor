<template>
  <canvas
    id="mask-canvas"
    width="1000"
    height="1000"
    :style="canvasUtil.getZoomChangeStyle(configRef.zoom)"
    @mousemove="handleMouseMove"
    @mouseup.stop="handleMouseUp"
    @mousedown.stop="handleMouseDown"
    @mouseout="handleMouseOut"
  ></canvas>
</template>

<script setup lang="ts">
  import useCanvas from './hooks/useCanvas';
  import controller, { CanvasOption } from './common/canvas-state-controller';
  import { getPos } from './common/canvas-util';
  import { onMounted } from 'vue';
  import { emitPersistLineEvent, emitPersistShapeEvent, onClickAreaEvent } from './common/event';
  import * as canvasUtil from './common/canvas-util';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import Area from './common/area';

  // canvas相关
  const ctxRef = useCanvas();
  const configRef = useEditorConfig();
  let beginPoint: PointA = { x: 0, y: 0 };
  let endPoint: PointA = { x: 0, y: 0 };

  // 鼠标事件根据不同按钮按下后分别处理
  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    switch (controller.getState()) {
      case CanvasOption.None: {
        if (controller.isCheckingArea()) {
          if (!controller.getCurrentArea()?.checkPointInArea(canvasUtil.getPos(e))) {
            controller.setCurrentArea(null);
            ctxRef.clean();
          }
        }
        break;
      }
      case CanvasOption.DrawLine:
      case CanvasOption.DrawCircle:
      case CanvasOption.DrawRect: {
        const point = getPos(e);
        beginPoint = point;
        controller.setActive(true);
        break;
      }
    }
  }
  function handleMouseMove(e: MouseEvent) {
    if (e.button !== 0 || !controller.getActive()) return;
    ctxRef.clean();
    endPoint = getPos(e);
    ctxRef.setLineDash([5, 5]);
    switch (controller.getState()) {
      case CanvasOption.DrawLine: {
        ctxRef.drawLine(beginPoint, endPoint);
        break;
      }
      case CanvasOption.DrawCircle: {
        ctxRef.drawCircle(beginPoint, canvasUtil.getDistance(beginPoint, endPoint));
        break;
      }
      case CanvasOption.DrawRect: {
        ctxRef.drawRect(beginPoint, endPoint);
        break;
      }
    }
  }
  function handleMouseUp(e: MouseEvent) {
    if (!controller.getActive()) return;
    endPoint = getPos(e);
    switch (controller.getState()) {
      case CanvasOption.DrawLine: {
        emitPersistLineEvent(beginPoint, endPoint);
        break;
      }
      case CanvasOption.DrawCircle: {
        emitPersistShapeEvent([beginPoint, canvasUtil.getDistance(beginPoint, endPoint)]);
        break;
      }
      case CanvasOption.DrawRect: {
        emitPersistShapeEvent([beginPoint, endPoint]);
        break;
      }
    }
    ctxRef.clean();
    controller.setActive(false);
  }
  function handleMouseOut() {
    // ctxRef.clean();
    controller.setActive(false);
  }

  onClickAreaEvent((_, area: Area | null) => {
    if (area) {
      const rect = area.getBoundRect();
      ctxRef.setLineDash([8, 8]);
      ctxRef.drawRect({ x: rect[0], y: rect[1] }, { x: rect[0] + rect[2], y: rect[1] + rect[3] });
      ctxRef.drawText(area.getCenterPoint(), area.getName());
    }
  });

  // 挂载时初始化
  onMounted(() => {
    let maskCanvas: HTMLCanvasElement | null = document.querySelector('#mask-canvas');
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
    border: 3px solid rgb(143, 143, 143);
    background-repeat: no-repeat;
    background-size: contain;
    position: absolute;
    z-index: 999;
  }
</style>
