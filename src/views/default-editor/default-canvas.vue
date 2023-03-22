<template>
  <canvas
    id="editCanvas"
    width="1000"
    height="1000"
    @mousemove.stop="handleMouseMove"
    @mouseup.stop="handleMouseUp"
    @mousedown.stop="handleMouseDown"
    @mouseout="handleMouseUp"
  ></canvas>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, watch } from 'vue';
  import { useCanvasConfigContext } from './hooks/useCanvasConfig';
  import controller, { CanvasOption } from './common/canvas-options';
  import * as canvasUtil from './common/canvas-util';
  import useCanvas from './hooks/useCanvas';
  import { onCanvasRevertEvent, onPersistLineEvent } from './common/event';

  enum StateKeep {
    Null, // 多次点击二者都可以
    KeepOn, // 多次点击仅能选中
    KeepOff, // 多次点击仅能消除选中
  }

  const props = defineProps({
    map: {
      type: File,
    },
  });

  // 更换背景图片
  watch(
    () => props.map,
    () => {
      if (!props.map) return;
      var reader = new FileReader(); //调用FileReader
      reader.readAsDataURL(props.map); //将文件读取为 DataURL(base64)
      reader.onload = function (evt) {
        document
          .querySelector('#editCanvas')
          ?.setAttribute('style', 'background-image: url(' + String(evt.target?.result) + ');');
      };
    },
  );
  // canvas相关
  const ctxRef = useCanvas();
  const configRef = useCanvasConfigContext();
  const linePoints: Map<String, PointA[]> = new Map();
  let movedPoints: PointA[] = [];
  let beginPoint: PointA = { x: 0, y: 0 };

  // 鼠标事件根据不同按钮按下后分别处理
  const lineStart = { offsetX: 0, offsetY: 0 };
  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    switch (controller.getState()) {
      case CanvasOption.FollowMouse: {
        const lastedPoint = movedPoints.pop();
        const point = canvasUtil.getPos(e);
        movedPoints = [];
        // 开启自动连接时才连接
        if (configRef.autoConnect) {
          if (lastedPoint && canvasUtil.getDistance(lastedPoint, point) < 20) {
            beginPoint = lastedPoint;
            movedPoints.push(point);
            break;
          }
        }
        beginPoint = point;
        // 没自动连接的话，存一下按下的点
        const key = canvasUtil.getCompressPos(point);
        linePoints.has(key) ? linePoints.get(key)?.push(point) : linePoints.set(key, [point]);
        break;
      }
      case CanvasOption.FollowMouseClear: {
        // changeFilledState(canvasUtil.getPos(e), StateKeep.KeepOff);
        break;
      }
      case CanvasOption.DrawLine: {
        lineStart.offsetX = e.offsetX;
        lineStart.offsetY = e.offsetY;

        break;
      }
      default:
        break;
    }
    controller.setActive(true);
  }
  function handleMouseMove(e: MouseEvent) {
    if (e.button !== 0 || !controller.getActive()) return;
    switch (controller.getState()) {
      case CanvasOption.FollowMouse: {
        const endPoint = _drawSmoothLine(e);
        if (endPoint) {
          beginPoint = endPoint;
        }
        break;
      }
      case CanvasOption.FollowMouseClear: {
        // changeFilledState(canvasUtil.getPos(e), StateKeep.KeepOff);
        break;
      }
      default:
        break;
    }
  }
  function handleMouseUp(e: MouseEvent) {
    if (e.button !== 0 || !controller.getActive()) return;
    const curPoint = canvasUtil.getPos(e);
    if (canvasUtil.isPointOverlap(curPoint, beginPoint)) {
      ctxRef.fillStyle = 'red';
      ctxRef.fillRect(curPoint.x, curPoint.y, 1, 1);
    } else {
      switch (controller.getState()) {
        case CanvasOption.FollowMouse: {
          _drawSmoothLine(e);
          if (configRef.autoConnect) {
            _autoConnect(curPoint);
            break;
          }
        }
        default:
          break;
      }
    }
    controller.setActive(false);
    ctxRef.save();
  }
  // 假如可以画线的话，画线
  function _drawSmoothLine(e: MouseEvent): PointA | null {
    movedPoints.push(canvasUtil.getPos(e));
    if (movedPoints.length > 3) {
      const lastTwoPoints = movedPoints.slice(-2);
      const controlPoint = lastTwoPoints[0];
      const endPoint: PointA = {
        x: (lastTwoPoints[0].x + lastTwoPoints[1].x) / 2,
        y: (lastTwoPoints[0].y + lastTwoPoints[1].y) / 2,
      };
      ctxRef.drawSmoothLine(beginPoint, controlPoint, endPoint);
      return endPoint;
    }
    return null;
  }
  // 判断是否需要自动连接
  function _autoConnect(curPoint: PointA) {
    // 压缩一下 x y 坐标，查找更快一些
    let key = canvasUtil.getCompressPos(curPoint);
    const points = linePoints.get(key);
    // 计算该点附近距离最近且小于20的点
    if (points && points.length) {
      let minDistance = 20;
      let minDistancePointIndex = -1;
      points.forEach((point, index) => {
        const distance = canvasUtil.getDistance(point, curPoint);
        if (distance < minDistance) {
          minDistance = distance;
          minDistancePointIndex = index;
        }
      });
      if (minDistancePointIndex >= 0) {
        ctxRef.drawLine(curPoint, points[minDistancePointIndex]);
        points.splice(minDistancePointIndex, 1);
      } else {
        linePoints.has(key) ? linePoints.get(key)?.push(curPoint) : linePoints.set(key, [curPoint]);
        return;
      }
    }
    // 没开启自动连接就将点存入
    linePoints.has(key) ? linePoints.get(key)?.push(curPoint) : linePoints.set(key, [curPoint]);
  }

  onCanvasRevertEvent(() => {
    ctxRef.revert();
  });
  onPersistLineEvent((_, payload) => {
    ctxRef.drawLine(payload.beginPoint, payload.endPoint);
    _autoConnect(payload.beginPoint);
    _autoConnect(payload.endPoint);
    ctxRef.save();
  });

  // 配置修改时，重置canvas
  watch(
    () => configRef.zoom,
    () => {
      drawCanvas();
    },
  );
  // 绘制基本网格和之前的内容
  function drawCanvas() {
    let editCanvas: HTMLCanvasElement | null = document.querySelector('#editCanvas');
    if (!ctxRef || !editCanvas) return;
  }
  function onKeyBoardDown(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === 'z') {
      ctxRef.revert();
    }
  }
  // 挂载时初始化
  onMounted(() => {
    window.addEventListener('keydown', onKeyBoardDown);

    let editCanvas: HTMLCanvasElement | null = document.querySelector('#editCanvas');
    if (editCanvas == null) return;
    let ctx = editCanvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    ctxRef.setupCanvas(ctx);
    drawCanvas();
    ctxRef.save();
  });
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeyBoardDown);
  });
</script>

<style scoped lang="less">
  #editCanvas {
    position: absolute;
    top: 0;
    left: 0;
    border: 5px solid #cccccc;
    background-repeat: no-repeat;
    background-size: contain;
  }
</style>
