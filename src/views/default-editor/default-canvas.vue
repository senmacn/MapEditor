<template>
  <canvas
    :id="layer?.uuid"
    width="2000"
    height="2000"
    @mousemove.stop="handleMouseMove"
    @mouseup.stop="handleMouseUp"
    @mousedown.stop="handleMouseDown"
    @mouseout="handleMouseUp"
  ></canvas>
</template>

<script setup lang="ts">
  import type { Layer } from './common/types';
  import { onBeforeUnmount, onMounted, watch } from 'vue';
  import { useCanvasConfigContext } from './hooks/useCanvasConfig';
  import controller, { CanvasOption } from './common/canvas-controller';
  import * as canvasUtil from './common/canvas-util';
  import useCanvas from './hooks/useCanvas';
  import { onCanvasRevertEvent, onPersistLineEvent } from './common/event';

  const props = defineProps({
    layer: {
      type: Object as PropType<Layer>,
    },
  });

  watch(
    () => props.layer?.map,
    () => {
      if (props.layer) {
        document
          .getElementById(props.layer?.uuid)
          ?.setAttribute('style', 'background-image: url(' + props.layer?.map + ');');
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
  const linePoints: Map<String, PointA> = new Map();
  let movedPoints: PointA[] = [];
  let beginPoint: PointA = { x: 0, y: 0 };
  // 初始化
  function setup() {
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
    ctxRef.save();

    props.layer.ctx = ctxRef;
  }

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
          if (lastedPoint && canvasUtil.getDistance(lastedPoint, point) < 20) {
            beginPoint = lastedPoint;
            movedPoints.push(point);
            break;
          }
        }
        beginPoint = point;
        // 没自动连接的话，存一下按下的点
        const key = canvasUtil.getPosKey(point);
        linePoints.set(key, point);
        break;
      }
      case CanvasOption.FollowMouseClear: {
        ctxRef.erase(canvasUtil.getPos(e));
        break;
      }
      case CanvasOption.DrawLine: {
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
        ctxRef.erase(canvasUtil.getPos(e));
        break;
      }
      default:
        break;
    }
  }
  function handleMouseUp(e: MouseEvent) {
    if (e.button !== 0 || !controller.getActive()) return;
    const curPoint = canvasUtil.getPos(e);
    switch (controller.getState()) {
      case CanvasOption.FollowMouse: {
        if (canvasUtil.isPointOverlap(curPoint, beginPoint)) {
          ctxRef.fillStyle = configRef.color;
          ctxRef.fillRect(curPoint.x, curPoint.y, 1, 1);
        } else {
          _drawSmoothLine(e);
          if (configRef.autoConnect) {
            _autoConnect(curPoint);
          }
        }
        break;
      }
      case CanvasOption.FollowMouseClear: {
        ctxRef.erase(canvasUtil.getPos(e), true);
      }

      default:
        break;
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
    // let key = canvasUtil.getPosKey(curPoint);
    // const points = linePoints.values();
    // // 计算该点附近距离最近且小于20的点
    // if (linePoints.size > 0) {
    //   let minDistance = 20;
    //   let minDistancePoint = null;
    //   for (const point of points) {
    //     const distance = canvasUtil.getDistance(point, curPoint);
    //     if (distance < minDistance) {
    //       minDistance = distance;
    //       minDistancePoint = point;
    //     }
    //   }
    //   if (minDistancePoint != null) {
    //     ctxRef.drawLine(curPoint, minDistancePoint);
    //     linePoints.delete(canvasUtil.getPosKey(minDistancePoint));
    //     return true;
    //   } else {
    //     linePoints.set(key, curPoint);
    //   }
    // }
    // // 没开启自动连接就将点存入
    // linePoints.set(key, curPoint);
    const endPoint = canvasUtil.getConnectEndPoint(ctxRef.getImageData(), curPoint)
    if (endPoint != null) {
      ctxRef.drawLine(curPoint, endPoint);
    }
    return false;
  }

  // 监听广播
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
      // drawCanvas();
    },
  );

  function onKeyBoardDown(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === 'z') {
      e.stopPropagation();
      ctxRef.revert();
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
