<template>
  <canvas
    id="area-canvas"
    @mousemove.stop="handleMouseMove"
    @mouseup.stop="handleMouseUp"
    @mousedown.stop="handleMouseDown"
  ></canvas>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, watch } from 'vue';
  import controller, { CanvasOption } from './common/canvas-state-controller';
  import * as canvasUtil from './utils/canvas-util';
  import * as imageDataUtil from './utils/image-data-util';
  import useCanvas from './hooks/useCanvas';
  import {
    onCanvasRedoEvent,
    onCanvasUndoEvent,
    onEditAreaEvent,
    onPersistLineEvent,
    onPersistShapeEvent,
  } from './common/event';
  import { Area } from './draw-element';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { message } from 'ant-design-vue';
  import Pen from './pen/Pen';
  import { useToggle } from '@vueuse/core';

  const props = defineProps({
    offset: {
      type: Object as PropType<Offset>,
      default: { x: 0, y: 0 },
    },
  });

  // canvas相关
  const ctxRef = useCanvas();
  const configRef = useEditorConfig();
  let movedPoints: PointA[] = [];
  let beginPoint: PointA = { x: 0, y: 0 };
  const [activeRef, setActiveRef] = useToggle(false);

  // 鼠标事件根据不同按钮按下后分别处理
  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    switch (controller.getState()) {
      case CanvasOption.FollowMouse: {
        const lastedPoint = movedPoints.pop();
        const point = canvasUtil.getPos(e);
        movedPoints = [];
        // 开启自动连接时才连接
        if (configRef.getAutoConnect) {
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
    setActiveRef(true);
  }

  function handleMouseMove(e: MouseEvent) {
    if (e.button !== 0 || !activeRef.value) return;
    const curPoint = canvasUtil.getPos(e);
    switch (controller.getState()) {
      case CanvasOption.FollowMouse: {
        _drawSmoothLine(curPoint);
        break;
      }
      case CanvasOption.FollowMouseClear: {
        ctxRef.erase(curPoint);
        break;
      }
    }
  }

  function handleMouseUp(e: MouseEvent) {
    if (e.button !== 0 || !activeRef.value) return;
    const curPoint = canvasUtil.getPos(e);
    switch (controller.getState()) {
      case CanvasOption.FollowMouse: {
        // 不能画点
        if (!canvasUtil.isPointOverlap(curPoint, beginPoint)) {
          const endPoint = _drawSmoothLine(curPoint, true);
          if (configRef.getAutoConnect && endPoint) {
            _autoConnect(endPoint);
          }
        }
        break;
      }
      case CanvasOption.FollowMouseClear: {
        ctxRef.erase(curPoint, true);
        break;
      }
    }
    setActiveRef(false);
    ctxRef.putSave();
  }
  // 假如可以画线的话，画线
  function _drawSmoothLine(point: PointA, isLast = false): PointA {
    movedPoints.push(point);
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
          x: Math.floor((lastTwoPoints[0].x + lastTwoPoints[1].x) / 2),
          y: Math.floor((lastTwoPoints[0].y + lastTwoPoints[1].y) / 2),
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
      configRef.getAutoConnectScope,
    );
    if (endPoint != null) {
      ctxRef.drawLine(curPoint, endPoint);
    }
  }
  // 监听广播
  onEditAreaEvent(function () {
    const currentArea = controller.getCurrentAreas()[0];
    if (currentArea) {
      currentArea.cancelSelect();
      const data = currentArea.getData();
      ctxRef.putImageData(
        data,
        currentArea.getBoundRect()[0] - props.offset.x,
        currentArea.getBoundRect()[1] - props.offset.y,
      );
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
      ctxRef.putSave();
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
      ctxRef.putSave();
    }
  });

  watch(
    () => controller.getState(),
    (newState, oldState) => {
      if (oldState === CanvasOption.Pen && newState !== CanvasOption.Pen) {
        const paths = Pen.getPath();
        if (paths.length === 0) return;
        let editCanvas: HTMLCanvasElement = document.getElementById(
          'area-canvas',
        ) as HTMLCanvasElement;
        Pen.renderTo(ctxRef, editCanvas, paths);
        ctxRef.putSave();
      }
    },
  );

  // zoom配置修改时，修改canvas大小
  // watch(
  //   () => configRef.zoom,
  //   () => {
  //     if (configRef.zoom) {
  //       const layer = document.getElementById('area-canvas');
  //       if (!layer) return;
  //       const style = canvasUtil.getZoomChangeStyle(configRef.zoom);
  //       layer.style.setProperty('transform', style.transform);
  //       layer.style.setProperty('top', style.top);
  //       layer.style.setProperty('left', style.left);
  //     }
  //   },
  // );

  // 初始化
  let setUpState = false;
  function setup() {
    if (setUpState) return;
    let editCanvas: HTMLCanvasElement = document.getElementById('area-canvas') as HTMLCanvasElement;
    if (editCanvas == null) return;
    const flag = configRef.getSize.x > 5000 || configRef.getSize.y > 5000;
    editCanvas.width = flag ? 5000 : configRef.getSize.x;
    editCanvas.height = flag ? 5000 : configRef.getSize.y;
    let ctx = editCanvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    ctxRef.setupCanvas(ctx);
    // drawCanvas();

    setUpState = true;
  }
  function onKeyBoardDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      controller.setState(CanvasOption.None);
    }
    if (e.ctrlKey) {
      if (e.key === 'z' && !controller.isDrawingPen()) {
        e.stopPropagation();
        e.preventDefault();
        ctxRef.undo();
      }
      if (e.key === 'y' && !controller.isDrawingPen()) {
        e.stopPropagation();
        e.preventDefault();
        ctxRef.redo();
      }
    }
  }
  function handleMouseUpOuter(e: MouseEvent) {
    if (e.button !== 0 || !activeRef.value) return;
    const canvas = ctxRef.getCanvas().canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - canvasRect.left, canvas.width));
    const y = Math.max(0, Math.min(e.clientY - canvasRect.top, canvas.height));
    handleMouseUp({ button: 0, offsetX: x, offsetY: y } as MouseEvent);
  }

  function handleMouseMoveOuter(e: MouseEvent) {
    if (e.button !== 0 || !activeRef.value) return;
    const canvas = ctxRef.getCanvas().canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - canvasRect.left, canvas.width));
    const y = Math.max(0, Math.min(e.clientY - canvasRect.top, canvas.height));
    handleMouseMove({ button: 0, offsetX: x, offsetY: y } as MouseEvent);
  }
  function handleMouseDownOuter(e: MouseEvent) {
    if (e.button !== 0) return;
    const canvas = ctxRef.getCanvas().canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - canvasRect.left, canvas.width));
    const y = Math.max(0, Math.min(e.clientY - canvasRect.top, canvas.height));
    handleMouseDown({ button: 0, offsetX: x, offsetY: y } as MouseEvent);
  }
  // 挂载时初始化
  onMounted(() => {
    setup();
    document.body.addEventListener('keydown', onKeyBoardDown);
    const fullDrawer = document.getElementsByClassName('map-editor')[0];
    fullDrawer.addEventListener('mousedown', handleMouseDownOuter);
    fullDrawer.addEventListener('mousemove', handleMouseMoveOuter);
    fullDrawer.addEventListener('mouseup', handleMouseUpOuter);
  });
  onBeforeUnmount(() => {
    document.body.removeEventListener('keydown', onKeyBoardDown);
    const fullDrawer = document.getElementsByClassName('map-editor')[0];
    fullDrawer.removeEventListener('mousedown', handleMouseDownOuter);
    fullDrawer.removeEventListener('mousemove', handleMouseMoveOuter);
    fullDrawer.removeEventListener('mouseup', handleMouseDownOuter);
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
    // 计算偏移
    boundRect[0] = boundRect[0] + props.offset.x;
    boundRect[1] = boundRect[1] + props.offset.y;
    const area = new Area('新区域', data, Object.assign({}, boundRect));
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
    /* border: 1px dotted black; */
  }
</style>
