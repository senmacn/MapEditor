<template>
  <canvas
    id="area-canvas"
    @mousemove.stop="handleMouseMove"
    @mouseup.stop="handleMouseUp"
    @mousedown.stop="handleMouseDown"
    @mouseout="handleMouseUp"
  ></canvas>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, watch } from 'vue';
  import controller, { CanvasOption } from './common/canvas-state-controller';
  import * as canvasUtil from './common/canvas-util';
  import * as imageDataUtil from './common/image-data-util';
  import useCanvas from './hooks/useCanvas';
  import {
    onCanvasRedoEvent,
    onCanvasUndoEvent,
    onEditAreaEvent,
    onPersistLineEvent,
    onPersistShapeEvent,
  } from './common/event';
  import Area from './common/area';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import debounce from 'lodash-es/debounce';
  import message from '@arco-design/web-vue/es/message';

  // canvas相关
  const ctxRef = useCanvas();
  const configRef = useEditorConfig();
  let movedPoints: PointA[] = [];
  let beginPoint: PointA = { x: 0, y: 0 };

  // 鼠标事件根据不同按钮按下后分别处理
  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    switch (controller.getState()) {
      case CanvasOption.FollowMouse: {
        const lastedPoint = movedPoints.pop();
        const point = canvasUtil.getPos(e);
        movedPoints = [];
        // 开启自动连接时才连接
        if (configRef.autoConnect) {
          // 可以连接最后一点的时候直接连接，否则调用自动连接函数进行连接
          if (lastedPoint && canvasUtil.getDistance(lastedPoint, point) < 30) {
            beginPoint = lastedPoint;
            movedPoints.push(point);
            break;
          } else {
            setTimeout(() => {
              _autoConnect(point);
            });
          }
        }
        beginPoint = point;
        break;
      }
      case CanvasOption.FollowMouseClear: {
        ctxRef.erase(canvasUtil.getPos(e));
        break;
      }
      case CanvasOption.DrawLine: {
        break;
      }
    }
    controller.setActive(true);
  }

  const handleMouseMove = debounce(
    function (e: MouseEvent) {
      if (e.button !== 0 || !controller.getActive()) return;
      switch (controller.getState()) {
        case CanvasOption.FollowMouse: {
          _drawSmoothLine(e);
          break;
        }
        case CanvasOption.FollowMouseClear: {
          ctxRef.erase(canvasUtil.getPos(e));
          break;
        }
      }
    },
    5,
    { leading: true },
  );
  function handleMouseUp(e: MouseEvent) {
    if (e.button !== 0 || !controller.getActive()) return;
    const curPoint = canvasUtil.getPos(e);
    switch (controller.getState()) {
      case CanvasOption.FollowMouse: {
        // 不能画点
        if (!canvasUtil.isPointOverlap(curPoint, beginPoint)) {
          const endPoint = _drawSmoothLine(e, true);
          if (configRef.autoConnect && endPoint) {
            _autoConnect(endPoint);
          }
        }
        break;
      }
      case CanvasOption.FollowMouseClear: {
        ctxRef.erase(canvasUtil.getPos(e), true);
      }
    }
    controller.setActive(false);
    ctxRef.save();
  }
  // 假如可以画线的话，画线
  function _drawSmoothLine(e: MouseEvent, isLast = false): PointA {
    movedPoints.push(canvasUtil.getPos(e));
    if (movedPoints.length > 3) {
      const lastTwoPoints = movedPoints.slice(-2);
      const controlPoint = lastTwoPoints[0];
      let endPoint: PointA;
      // 最后一次使用end点，否则使用start-end中间点
      if (isLast) {
        endPoint = { x: lastTwoPoints[1].x, y: lastTwoPoints[1].y };
        ctxRef.drawLine(beginPoint, endPoint);
      } else {
        endPoint = {
          x: (lastTwoPoints[0].x + lastTwoPoints[1].x) / 2,
          y: (lastTwoPoints[0].y + lastTwoPoints[1].y) / 2,
        };
        ctxRef.drawSmoothLine(beginPoint, controlPoint, endPoint);
      }

      beginPoint = endPoint;
      movedPoints.splice(0, 1);
      return endPoint;
    }
    return movedPoints[movedPoints.length - 1];
  }
  // 判断是否需要自动连接
  function _autoConnect(curPoint: PointA) {
    const endPoint = imageDataUtil.getConnectEndPoint(
      ctxRef.getImageData(),
      curPoint,
      configRef.lineWidth,
    );
    if (endPoint != null) {
      ctxRef.drawLine(curPoint, endPoint);
    }
  }

  // 监听广播
  onEditAreaEvent(() => {
    const currentArea = controller.getCurrentArea();
    if (currentArea !== null) {
      const data = currentArea.getData();
      ctxRef.putImageData(data, currentArea.getBoundRect()[0], currentArea.getBoundRect()[1]);
    }
  });
  onCanvasRedoEvent(() => {
    if (controller.isDrawingArea()) {
      ctxRef.redo();
    }
  });
  onCanvasUndoEvent(() => {
    if (controller.isDrawingArea()) {
      ctxRef.undo();
    }
  });
  onPersistLineEvent((_, payload) => {
    if (controller.isDrawingArea()) {
      _autoConnect(payload.beginPoint);
      _autoConnect(payload.endPoint);
      ctxRef.drawLine(payload.beginPoint, payload.endPoint);
      ctxRef.save();
    }
  });
  onPersistShapeEvent((_, payload) => {
    if (controller.isDrawingArea()) {
      switch (controller.getState()) {
        case CanvasOption.DrawCircle: {
          // @ts-ignore
          ctxRef.drawCircle(...payload);
          break;
        }
        case CanvasOption.DrawRect: {
          // @ts-ignore
          ctxRef.drawRect(...payload);
          break;
        }
      }
      ctxRef.save();
    }
  });

  // zoom配置修改时，修改canvas大小
  watch(
    () => configRef.zoom,
    () => {
      if (configRef.zoom) {
        const layer = document.getElementById('area-canvas');
        if (!layer) return;
        const style = canvasUtil.getZoomChangeStyle(configRef.zoom);
        layer.style.setProperty('transform', style.transform);
        layer.style.setProperty('top', style.top);
        layer.style.setProperty('left', style.left);
      }
    },
  );

  // 初始化
  let setUpState = false;
  function setup() {
    if (setUpState) return;
    let editCanvas: HTMLCanvasElement = document.getElementById('area-canvas') as HTMLCanvasElement;
    if (editCanvas == null) return;
    editCanvas.width = configRef.size.x;
    editCanvas.height = configRef.size.y;
    let ctx = editCanvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    ctxRef.setupCanvas(ctx);
    // drawCanvas();

    setUpState = true;
  }
  function onKeyBoardDown(e: KeyboardEvent) {
    if (e.ctrlKey) {
      e.stopPropagation();
      if (e.key === 'z') ctxRef.undo();
      if (e.key === 'y') ctxRef.redo();
    }
  }
  // 挂载时初始化
  onMounted(() => {
    setup();
    window.addEventListener('keydown', onKeyBoardDown);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeyBoardDown);
  });

  // 对外暴露
  function getCreatedArea() {
    // 先获取完整的数据内容
    const fullData = ctxRef.getImageData();
    const boundRect = imageDataUtil.getImageDataBoundRect(fullData);
    if (boundRect.every((pos) => !pos)) {
      message.warning('该区域未包含有效点！');
      return null;
    }
    // 获取有数据的内容
    const data = ctxRef.getImageData(boundRect);
    const area = new Area('新区域', data);
    area.setBoundRect(boundRect);
    return area;
  }
  defineExpose({
    getCreatedArea,
  });
</script>

<style scoped lang="less">
  canvas {
    position: absolute;
    top: 0;
    left: 0;
    background-repeat: no-repeat;
    background-size: contain;
  }
</style>
