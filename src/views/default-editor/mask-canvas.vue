<template>
  <canvas
    id="mask-canvas"
    @mousemove.stop="handleMouseMove"
    @mouseup.stop="handleMouseUp"
    @mousedown.stop="handleMouseDown"
    @mouseout="handleMouseMove"
  ></canvas>
</template>

<script setup lang="ts">
  import useCanvas from './hooks/useCanvas';
  import controller, { CanvasOption } from './common/canvas-state-controller';
  import { getPos } from './utils/canvas-util';
  import { onBeforeUnmount, onMounted } from 'vue';
  import { emitPersistLineEvent, emitPersistShapeEvent } from './common/event';
  import * as canvasUtil from './utils/canvas-util';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { useToggle } from '@vueuse/core';
  import throttle from 'lodash-es/throttle';

  // canvas相关
  const ctxRef = useCanvas();
  const configRef = useEditorConfig();
  let beginPoint: PointA = { x: 0, y: 0 };
  let endPoint: PointA = { x: 0, y: 0 };
  let prevPoint: PointA = { x: 0, y: 0 };
  const [activeRef, setActiveRef] = useToggle(false);

  // 鼠标事件根据不同按钮按下后分别处理
  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    switch (controller.getState()) {
      case CanvasOption.DrawLine:
      case CanvasOption.DrawCircle:
      case CanvasOption.DrawRect: {
        const point = getPos(e);
        beginPoint = point;
        prevPoint = beginPoint;
        setActiveRef(true);
        break;
      }
    }
  }
  const handleMouseMove = throttle(syncHandleMouseMove, 16);
  function syncHandleMouseMove(e: MouseEvent) {
    if (e.button !== 0 || !activeRef.value) return;
    endPoint = getPos(e);
    // 清除
    const radius = Math.sqrt(
      Math.pow(beginPoint.x - prevPoint.x, 2) + Math.pow(beginPoint.y - prevPoint.y, 2),
    );
    ctxRef.clean([
      beginPoint.x - radius - 50,
      beginPoint.y - radius - 50,
      // 扩大一点范围防止少
      2 * radius + 100,
      2 * radius + 100,
    ]);
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
    prevPoint = getPos(e);
  }

  function handleMouseUp(e: MouseEvent) {
    if (!activeRef.value) return;
    endPoint = getPos(e);
    switch (controller.getState()) {
      case CanvasOption.DrawLine: {
        if (canvasUtil.isPointOverlap(beginPoint, endPoint)) {
          break;
        }
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
    // 清除
    const radius = Math.sqrt(
      Math.pow(beginPoint.x - prevPoint.x, 2) + Math.pow(beginPoint.y - prevPoint.y, 2),
    );
    ctxRef.clean([
      beginPoint.x - radius - 50,
      beginPoint.y - radius - 50,
      // 扩大一点范围防止少
      2 * radius + 100,
      2 * radius + 100,
    ]);
    setActiveRef(false);
  }

  // 挂载时初始化
  function setup() {
    let maskCanvas: HTMLCanvasElement | null = document.querySelector('#mask-canvas');
    if (maskCanvas == null) return;
    maskCanvas.width = configRef.size.x;
    maskCanvas.height = configRef.size.y;
    let ctx = maskCanvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    ctxRef.setupCanvas(ctx);
  }

  function handleMouseUpOuter(e: MouseEvent) {
    if (e.button !== 0 || !activeRef.value) return;
    const canvas = ctxRef.getCanvas().canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    handleMouseUp({ button: 0, offsetX: x, offsetY: y } as MouseEvent);
  }

  function handleMouseMoveOuter(e: MouseEvent) {
    if (e.button !== 0 || !activeRef.value) return;
    const canvas = ctxRef.getCanvas().canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    syncHandleMouseMove({ button: 0, offsetX: x, offsetY: y } as MouseEvent);
  }
  // 挂载时初始化
  onMounted(() => {
    setup();
    const fullDrawer = document.getElementsByClassName('map-editor')[0];
    fullDrawer.addEventListener('mouseup', handleMouseUpOuter);
    fullDrawer.addEventListener('mousemove', handleMouseMoveOuter);
  });
  onBeforeUnmount(() => {
    const fullDrawer = document.getElementsByClassName('map-editor')[0];
    fullDrawer.removeEventListener('mouseup', handleMouseUpOuter);
    fullDrawer.removeEventListener('mousemove', handleMouseMoveOuter);

    handleMouseMove.cancel();
  });
</script>

<style scoped lang="less">
  #mask-canvas {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
  }
</style>
