<template>
  <canvas
    id="mask-canvas"
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
  import { onMounted, watch } from 'vue';
  import {
    emitPersistLineEvent,
    emitPersistShapeEvent,
    onClickAreaEvent,
    onDeleteAreaEvent,
  } from './common/event';
  import * as canvasUtil from './common/canvas-util';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import Area from './common/area';
  import debounce from 'lodash-es/debounce';

  // canvas相关
  const ctxRef = useCanvas();
  const configRef = useEditorConfig();
  let beginPoint: PointA = { x: 0, y: 0 };
  let endPoint: PointA = { x: 0, y: 0 };
  let prevPoint: PointA = { x: 0, y: 0 };

  // 鼠标事件根据不同按钮按下后分别处理
  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    switch (controller.getState()) {
      case CanvasOption.None: {
        if (controller.isCheckingArea()) {
          if (!controller.getCurrentArea()?.checkPointInArea(canvasUtil.getPos(e))) {
            ctxRef.clean(controller.getCurrentArea()?.getBoundRect() || [0, 0, 0, 0]);
            controller.setCurrentArea(null);
          }
        }
        break;
      }
      case CanvasOption.DrawLine:
      case CanvasOption.DrawCircle:
      case CanvasOption.DrawRect: {
        const point = getPos(e);
        beginPoint = point;
        prevPoint = beginPoint;
        controller.setActive(true);
        break;
      }
    }
  }
  const handleMouseMove = debounce(
    function (e: MouseEvent) {
      if (e.button !== 0 || !controller.getActive()) return;
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
    },
    5,
    { leading: true, trailing: true },
  );

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

  onDeleteAreaEvent(() => {
    ctxRef.clean(controller.getCurrentArea()?.getBoundRect() || [0, 0, 0, 0]);
  });

  // 挂载时初始化
  onMounted(() => {
    let maskCanvas: HTMLCanvasElement | null = document.querySelector('#mask-canvas');
    if (maskCanvas == null) return;
    maskCanvas.width = configRef.size.x;
    maskCanvas.height = configRef.size.y;
    let ctx = maskCanvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    ctxRef.setupCanvas(ctx);
  });

  // zoom配置修改时，修改canvas大小
  watch(
    () => configRef.zoom,
    () => {
      if (configRef.zoom) {
        const maskCanvas = document.getElementById('mask-canvas');
        if (!maskCanvas) return;
        const style = canvasUtil.getZoomChangeStyle(configRef.zoom);
        maskCanvas.style.setProperty('transform', style.transform);
        maskCanvas.style.setProperty('top', style.top);
        maskCanvas.style.setProperty('left', style.left);
      }
    },
  );
</script>

<style scoped lang="less">
  #mask-canvas {
    position: absolute;
    top: 0;
    left: 0;
    background-repeat: no-repeat;
    background-size: contain;
    position: absolute;
    z-index: 999;
  }
</style>
