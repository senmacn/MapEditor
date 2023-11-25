<template>
  <div id="area-canvas" @mousemove="syncHandleMouseMove" @mouseup="handleMouseUp" @mousedown="handleMouseDown">
    <canvas id="area-canvas-1"></canvas>
    <canvas id="area-canvas-2"></canvas>
    <canvas id="area-canvas-3"></canvas>
    <canvas id="area-canvas-4"></canvas>
  </div>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, watch } from 'vue';
  import controller from './common/canvas-state-controller';
  import * as canvasUtil from './utils/canvas-util';
  import * as imageDataUtil from './utils/image-data-util';
  import useExpandCanvas from './hooks/useExpandCanvas';
  import {
    onEditWithAreaEvent,
    onCanvasRedoEvent,
    onCanvasUndoEvent,
    onEditAreaEvent,
    onPersistLineEvent,
    onPersistShapeEvent,
    onEditPathwayEvent,
  } from './common/event';
  import { Area, Pathway } from './draw-element';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { message } from 'ant-design-vue';
  import Pen from './pen/Pen';
  import { useToggle } from '@vueuse/core';
  import { CanvasOption } from './common/types';

  const props = defineProps({
    offset: {
      type: Object as PropType<Offset>,
      default: { x: 0, y: 0 },
    },
  });

  // canvas相关
  const ctxRef = useExpandCanvas();
  const configRef = useEditorConfig();
  let movedPoints: PointA[] = [];
  let beginPoint: PointA = { x: 0, y: 0 };
  const [activeRef, setActiveRef] = useToggle(false);

  // 鼠标事件根据不同按钮按下后分别处理
  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    if (Reflect.has(e, 'stopPropagation')) {
      e.stopPropagation();
    }
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
            _autoConnect(point);
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

  function syncHandleMouseMove(e: MouseEvent) {
    if (e.button !== 0 || !activeRef.value) return;
    if (Reflect.has(e, 'stopPropagation')) {
      e.stopPropagation();
    }
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
    if (Reflect.has(e, 'stopPropagation')) {
      e.stopPropagation();
    }
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
    // 仅计算点周围
    const startX = curPoint.x - 50 > 0 ? curPoint.x - 50 : 0;
    const startY = curPoint.y - 50 > 0 ? curPoint.y - 50 : 0;
    const endPoint = imageDataUtil.getConnectEndPoint(
      ctxRef.getImageData([startX, startY, 100, 100]),
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
    const currentArea = controller.getCurrentAreas()[controller.getCurrentAreas().length - 1];
    if (currentArea) {
      // 新增、编辑时得取消选中
      currentArea.cancelSelect();
      currentArea.hide();
      const data = currentArea.getData();
      ctxRef.drawImageData(data, ...currentArea.getActualBoundRect()).then(() => {
        ctxRef.putSave();
      });
    }
  });
  onEditWithAreaEvent(function () {
    const results = controller.getCurrentAreas().map((area) => {
      area.hide();
      area.cancelSelect();
      ctxRef.drawImageData(area.getData(), ...area.getActualBoundRect());
    });
    Promise.all(results).then(() => {
      ctxRef.putSave();
    });
  });
  onEditPathwayEvent(function () {
    const currentPathway = controller.getCurrentPathway();
    if (currentPathway) {
      // 新增、编辑时得取消选中
      currentPathway.cancelSelect();
      currentPathway.hide();
      const data = currentPathway.getData();
      ctxRef.drawImageData(data, ...currentPathway.getActualBoundRect()).then(() => {
        ctxRef.putSave();
      });
    }
  });

  onCanvasRedoEvent(() => {
    if (controller.isDrawing()) {
      ctxRef.redo();
    }
  });
  onCanvasUndoEvent(() => {
    if (controller.isDrawing()) {
      ctxRef.undo();
    }
  });
  onPersistLineEvent((_, payload) => {
    if (controller.isDrawing()) {
      _autoConnect(payload.beginPoint);
      _autoConnect(payload.endPoint);
      ctxRef.drawLine(payload.beginPoint, payload.endPoint);
      ctxRef.putSave();
    }
  });
  onPersistShapeEvent((_, payload) => {
    if (controller.isDrawing()) {
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
        const imagedata = Pen.getImageData();
        if (!imagedata) return;
        ctxRef.drawImageData(
          imagedata,
          0,
          0,
          configRef.getProjectSizeConfigPxWidth,
          configRef.getProjectSizeConfigPxHeight,
        );
        ctxRef.putSave();
      }
    },
  );

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
    const canvasRect = (<HTMLElement>document.getElementById('area-canvas')).getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(e.clientX - canvasRect.left, configRef.getProjectSizeConfigPxWidth * configRef.getZoom) / configRef.zoom,
    );
    const y = Math.max(
      0,
      Math.min(e.clientY - canvasRect.top, configRef.getProjectSizeConfigPxHeight * configRef.getZoom) / configRef.zoom,
    );
    handleMouseUp({ button: 0, offsetX: x, offsetY: y } as MouseEvent);
  }

  function handleMouseMoveOuter(e: MouseEvent) {
    if (e.button !== 0 || !activeRef.value) return;
    if (Reflect.has(e, 'stopPropagation')) {
      e.stopPropagation();
    }
    const canvasRect = (<HTMLElement>document.getElementById('area-canvas')).getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(e.clientX - canvasRect.left, configRef.getProjectSizeConfigPxWidth * configRef.zoom) / configRef.zoom,
    );
    const y = Math.max(
      0,
      Math.min(e.clientY - canvasRect.top, configRef.getProjectSizeConfigPxHeight * configRef.zoom) / configRef.zoom,
    );
    syncHandleMouseMove({ button: 0, offsetX: x, offsetY: y } as MouseEvent);
  }
  function handleMouseDownOuter(e: MouseEvent) {
    if (e.button !== 0) return;
    const canvasRect = (<HTMLElement>document.getElementById('area-canvas')).getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(e.clientX - canvasRect.left, configRef.getProjectSizeConfigPxWidth * configRef.zoom) / configRef.zoom,
    );
    const y = Math.max(
      0,
      Math.min(e.clientY - canvasRect.top, configRef.getProjectSizeConfigPxHeight * configRef.zoom) / configRef.zoom,
    );
    handleMouseDown({ button: 0, offsetX: x, offsetY: y } as MouseEvent);
  }

  // 挂载时初始化
  onMounted(() => {
    // 挂载时初始化
    const width = configRef.getProjectSizeConfigPxWidth;
    const height = configRef.getProjectSizeConfigPxHeight;
    document
      .getElementById('area-canvas')
      ?.setAttribute(
        'style',
        `width: ${width}px; height: ${height}px;` + document.getElementById('area-canvas')?.getAttribute('style'),
      );

    const areaCanvas1 = <HTMLCanvasElement>document.getElementById('area-canvas-1');
    areaCanvas1.setAttribute('style', 'top: 0px; left: 0px;');
    areaCanvas1.width = width / 2;
    areaCanvas1.height = height / 2;
    const areaCanvas2 = <HTMLCanvasElement>document.getElementById('area-canvas-2');
    areaCanvas2?.setAttribute('style', `top: 0px; left: ${width / 2}px;`);
    areaCanvas2.width = width / 2;
    areaCanvas2.height = height / 2;
    const areaCanvas3 = <HTMLCanvasElement>document.getElementById('area-canvas-3');
    areaCanvas3?.setAttribute('style', `top: ${height / 2}px; left: 0px;`);
    areaCanvas3.width = width / 2;
    areaCanvas3.height = height / 2;
    const areaCanvas4 = <HTMLCanvasElement>document.getElementById('area-canvas-4');
    areaCanvas4?.setAttribute('style', `top: ${height / 2}px; left: ${width / 2}px;`);
    areaCanvas4.width = width / 2;
    areaCanvas4.height = height / 2;

    ctxRef.setupCanvas(width, height, [areaCanvas1, areaCanvas2, areaCanvas3, areaCanvas4]);
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
    fullDrawer.removeEventListener('mouseup', handleMouseUpOuter);
    ctxRef.destroy();
  });

  function getCreatedData() {
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
    return [data, Object.assign({}, boundRect)] as any;
  }
  // 对外暴露
  function getCreatedArea() {
    const [data, boundRect] = getCreatedData();
    return new Area('新区域', data, Object.assign({}, boundRect));
  }
  function getCreatedPathway() {
    const [data, boundRect] = getCreatedData();
    return new Pathway('new', data, Object.assign({}, boundRect));
  }
  defineExpose({
    getCreatedArea,
    getCreatedPathway,
  });
</script>

<style scoped lang="less">
  #area-canvas {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
  }
  #area-canvas-1,
  #area-canvas-2,
  #area-canvas-3,
  #area-canvas-4 {
    position: absolute;
    z-index: 100;
    pointer-events: none;
  }
</style>
