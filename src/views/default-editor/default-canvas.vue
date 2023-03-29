<template>
  <canvas
    :id="layer?.uuid"
    width="1000"
    height="1000"
    :style="styleRef"
    @mousemove.stop="handleMouseMove"
    @mouseup.stop="handleMouseUp"
    @mousedown.stop="handleMouseDown"
    @mouseout="handleMouseUp"
  ></canvas>
</template>

<script setup lang="ts">
  import type { Layer } from './common/types';
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { useCanvasConfigContext } from './hooks/useCanvasConfig';
  import controller, { CanvasOption } from './common/canvas-controller';
  import * as canvasUtil from './common/canvas-util';
  import useCanvas from './hooks/useCanvas';
  import { onCanvasRedoEvent, onCanvasUndoEvent, onPersistLineEvent } from './common/event';

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
  let movedPoints: PointA[] = [];
  let beginPoint: PointA = { x: 0, y: 0 };
  // 初始化
  let setUpState = false;
  function setup() {
    if (!props.layer || setUpState) return;
    let editCanvas: HTMLCanvasElement = document.getElementById(
      props.layer.uuid,
    ) as HTMLCanvasElement;
    if (editCanvas == null) return;
    let ctx = editCanvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    ctxRef.setupCanvas(ctx, configRef);
    // drawCanvas();

    props.layer.ctx = ctxRef;
    setUpState = true;
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
      default:
        break;
    }
    controller.setActive(true);
  }
  function handleMouseMove(e: MouseEvent) {
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

      default:
        break;
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
    const endPoint = canvasUtil.getConnectEndPoint(
      ctxRef.getImageData(),
      curPoint,
      configRef.lineWidth,
    );
    if (endPoint != null) {
      ctxRef.drawLine(curPoint, endPoint);
    }
  }

  // 监听广播
  onCanvasRedoEvent(() => {
    if (props.layer?.hot) {
      ctxRef.redo();
    }
  });
  onCanvasUndoEvent(() => {
    if (props.layer?.hot) {
      ctxRef.undo();
    }
  });
  onPersistLineEvent((_, payload) => {
    _autoConnect(payload.beginPoint);
    _autoConnect(payload.endPoint);
    ctxRef.drawLine(payload.beginPoint, payload.endPoint);
    ctxRef.save();
  });

  // zoom配置修改时，修改canvas大小
  const styleRef = ref('');
  watch(
    () => configRef.zoom,
    () => {
      if (configRef.zoom){
        styleRef.value = canvasUtil.getZoomChangeStyle(configRef.zoom)
      }
    },
  );

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
