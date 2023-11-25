<template>
  <div
    id="mask-canvas"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mousedown="handleMouseDown"
    @mouseout="handleMouseMove"
  >
    <canvas id="mask-canvas-1"></canvas>
    <canvas id="mask-canvas-2"></canvas>
    <canvas id="mask-canvas-3"></canvas>
    <canvas id="mask-canvas-4"></canvas>
  </div>
</template>

<script setup lang="ts">
  import useExpandCanvas from './hooks/useExpandCanvas';
  import controller from './common/canvas-state-controller';
  import { getPos } from './utils/canvas-util';
  import { onBeforeUnmount, onMounted } from 'vue';
  import { emitPersistLineEvent, emitPersistShapeEvent } from './common/event';
  import * as canvasUtil from './utils/canvas-util';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { useToggle } from '@vueuse/core';
  import throttle from 'lodash-es/throttle';
  import { CanvasOption } from './common/types';

  // canvas相关
  const ctxRef = useExpandCanvas();
  const configRef = useEditorConfig();
  let beginPoint: PointA = { x: 0, y: 0 };
  let endPoint: PointA = { x: 0, y: 0 };
  let prevPoint: PointA = { x: 0, y: 0 };
  const [activeRef, setActiveRef] = useToggle(false);

  // 鼠标事件根据不同按钮按下后分别处理
  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    if (Reflect.has(e, 'stopPropagation')) {
      e.stopPropagation();
    }
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
    if (Reflect.has(e, 'stopPropagation')) {
      e.stopPropagation();
    }
    endPoint = getPos(e);
    // 清除
    const radius = Math.sqrt(Math.pow(beginPoint.x - prevPoint.x, 2) + Math.pow(beginPoint.y - prevPoint.y, 2));
    ctxRef.clean([
      beginPoint.x - radius - 50,
      beginPoint.y - radius - 50,
      // 扩大一点范围防止少
      2 * radius + 100,
      2 * radius + 100,
    ]);
    // ctxRef.setLineDash([5, 5]);
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
    if (!activeRef.value || e.button !== 0) return;
    if (Reflect.has(e, 'stopPropagation')) {
      e.stopPropagation();
    }
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
    const radius = Math.sqrt(Math.pow(beginPoint.x - prevPoint.x, 2) + Math.pow(beginPoint.y - prevPoint.y, 2));
    ctxRef.clean([
      beginPoint.x - radius - 50,
      beginPoint.y - radius - 50,
      // 扩大一点范围防止少
      2 * radius + 100,
      2 * radius + 100,
    ]);
    setActiveRef(false);
  }

  function handleMouseUpOuter(e: MouseEvent) {
    if (e.button !== 0 || !activeRef.value) return;
    if (Reflect.has(e, 'stopPropagation')) {
      e.stopPropagation();
    }
    const canvasRect = (<HTMLElement>document.getElementById('mask-canvas')).getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    handleMouseUp({ button: 0, offsetX: x, offsetY: y } as MouseEvent);
  }

  function handleMouseMoveOuter(e: MouseEvent) {
    if (e.button !== 0 || !activeRef.value) return;
    // 跳过当前canvas上触发的
    if ((<HTMLElement>e.target).id.includes('mask-canvas')) {
      return;
    }
    const canvasRect = (<HTMLElement>document.getElementById('mask-canvas')).getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    syncHandleMouseMove({ button: 0, offsetX: x, offsetY: y } as MouseEvent);
  }
  // 挂载时初始化
  onMounted(() => {
    // 挂载时初始化
    const width = configRef.getProjectSizeConfigPxWidth;
    const height = configRef.getProjectSizeConfigPxHeight;
    document
      .getElementById('mask-canvas')
      ?.setAttribute(
        'style',
        `width: ${width}px; height: ${height}px;` + document.getElementById('mask-canvas')?.getAttribute('style'),
      );

    const maskCanvas1 = <HTMLCanvasElement>document.getElementById('mask-canvas-1');
    maskCanvas1.setAttribute('style', 'top: 0px; left: 0px;');
    maskCanvas1.width = width / 2;
    maskCanvas1.height = height / 2;
    const maskCanvas2 = <HTMLCanvasElement>document.getElementById('mask-canvas-2');
    maskCanvas2?.setAttribute('style', `top: 0px; left: ${width / 2}px;`);
    maskCanvas2.width = width / 2;
    maskCanvas2.height = height / 2;
    const maskCanvas3 = <HTMLCanvasElement>document.getElementById('mask-canvas-3');
    maskCanvas3?.setAttribute('style', `top: ${height / 2}px; left: 0px;`);
    maskCanvas3.width = width / 2;
    maskCanvas3.height = height / 2;
    const maskCanvas4 = <HTMLCanvasElement>document.getElementById('mask-canvas-4');
    maskCanvas4?.setAttribute('style', `top: ${height / 2}px; left: ${width / 2}px;`);
    maskCanvas4.width = width / 2;
    maskCanvas4.height = height / 2;

    ctxRef.setupCanvas(width, height, [maskCanvas1, maskCanvas2, maskCanvas3, maskCanvas4]);

    const fullDrawer = document.getElementsByClassName('map-editor')[0];
    fullDrawer.addEventListener('mouseup', handleMouseUpOuter);
    fullDrawer.addEventListener('mousemove', handleMouseMoveOuter);
  });
  onBeforeUnmount(() => {
    const fullDrawer = document.getElementsByClassName('map-editor')[0];
    fullDrawer.removeEventListener('mouseup', handleMouseUpOuter);
    fullDrawer.removeEventListener('mousemove', handleMouseMoveOuter);

    handleMouseMove.cancel();

    ctxRef.destroy();
  });
</script>

<style scoped lang="less">
  #mask-canvas {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
  }
  #mask-canvas-1,
  #mask-canvas-2,
  #mask-canvas-3,
  #mask-canvas-4 {
    position: absolute;
    z-index: 100;
    pointer-events: none;
  }
</style>
