<template>
  <div class="content-box" @wheel="">
    <div class="scroller" :style="configRef.style">
      <canvas
        id="editCanvas"
        width="1000"
        height="1000"
        @mousemove="handleMouseMove"
        @mouseup.stop="handleMouseUp"
        @mousedown.stop="handleMouseDown"
        @wheel.stop
      ></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, watch } from 'vue';
  import { useCanvasConfigContext } from './context/useCanvasConfig';
  import controller, { CanvasOption } from './common/canvas-options';
  import { IMAGE_SIZE } from './common/config';
  import { CanvasUtil } from './common/canvas-util';
  import useCanvas from './hooks/useCanvas';
  import { onCanvasRevertEvent } from './common/event';

  enum StateKeep {
    Null, // 多次点击二者都可以
    KeepOn, // 多次点击仅能选中
    KeepOff, // 多次点击仅能消除选中
  }

  const props = defineProps({
    filledMap: {
      type: Map<String, Boolean>,
      default: new Map(),
    },
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
  const canvasUtil = new CanvasUtil(configRef);

  // 鼠标事件根据不同按钮按下后分别处理
  const lineStart = { offsetX: 0, offsetY: 0 };
  const tempFilledMap = new Map<String, Boolean>();
  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    switch (controller.getState()) {
      case CanvasOption.ClickOnce: {
        changeFilledState(canvasUtil.getGridByEvent(e));
        break;
      }
      case CanvasOption.FollowMouse: {
        changeFilledState(canvasUtil.getGridByEvent(e), StateKeep.KeepOn);
        controller.setActive(true);
        break;
      }
      case CanvasOption.FollowMouseClear: {
        changeFilledState(canvasUtil.getGridByEvent(e), StateKeep.KeepOff);
        controller.setActive(true);
        break;
      }
      case CanvasOption.DrawLine: {
        lineStart.offsetX = e.offsetX;
        lineStart.offsetY = e.offsetY;
        controller.setActive(true);
        break;
      }
      default:
        break;
    }
  }
  let oldLines: Point[] = [];
  function handleMouseMove(e: MouseEvent) {
    if (e.button !== 0 || !controller.getActive()) return;
    switch (controller.getState()) {
      case CanvasOption.FollowMouse: {
        changeFilledState(canvasUtil.getGridByEvent(e), StateKeep.KeepOn);
        break;
      }
      case CanvasOption.FollowMouseClear: {
        changeFilledState(canvasUtil.getGridByEvent(e), StateKeep.KeepOff);
        break;
      }
      case CanvasOption.DrawLine: {
        oldLines.forEach((point) => changeTempFilledState(point, StateKeep.KeepOff));
        const startGrid = canvasUtil.getGrid(lineStart.offsetX, lineStart.offsetY);
        const endGrid = canvasUtil.getGrid(e.offsetX, e.offsetY);
        const line = canvasUtil.getLines(startGrid, endGrid);
        line.forEach((point) => changeTempFilledState(point, StateKeep.KeepOn));
        oldLines = line;
        break;
      }
      default:
        break;
    }
  }
  function handleMouseUp(e: MouseEvent) {
    switch (controller.getState()) {
      case CanvasOption.DrawLine: {
        oldLines = [];
        tempFilledMap.clear();
        const startGrid = canvasUtil.getGrid(lineStart.offsetX, lineStart.offsetY);
        const endGrid = canvasUtil.getGrid(e.offsetX, e.offsetY);
        const line = canvasUtil.getLines(startGrid, endGrid);
        line.forEach((point) => changeFilledState(point, StateKeep.KeepOn));
        break;
      }

      default:
        break;
    }
    controller.setActive(false);
    ctxRef.save();
  }
  function changeTempFilledState(gridPoint: Point, keepOn = StateKeep.Null) {
    const [xGrid, yGrid] = gridPoint;
    const key = xGrid + ',' + yGrid;
    if (tempFilledMap.get(key) && keepOn !== StateKeep.KeepOn && !props.filledMap.get(key)) {
      ctxRef.clearRect(...canvasUtil.getRect(xGrid, yGrid));
      tempFilledMap.set(key, false);
    } else if (!tempFilledMap.get(key) && keepOn !== StateKeep.KeepOff) {
      ctxRef.fillStyle = 'red';
      ctxRef.fillRect(...canvasUtil.getRect(xGrid, yGrid));
      tempFilledMap.set(key, true);
    }
  }
  // 结合点击以及维持状态来切换网格点击状态
  function changeFilledState(gridPoint: Point, keepOn = StateKeep.Null) {
    const [xGrid, yGrid] = gridPoint;
    const key = xGrid + ',' + yGrid;
    if (props.filledMap.get(key) && keepOn !== StateKeep.KeepOn) {
      ctxRef.clearRect(...canvasUtil.getRect(xGrid, yGrid));
      props.filledMap.set(key, false);
    } else if (!props.filledMap.get(key) && keepOn !== StateKeep.KeepOff) {
      ctxRef.fillStyle = 'red';
      ctxRef.fillRect(...canvasUtil.getRect(xGrid, yGrid));
      props.filledMap.set(key, true);
    }
  }

  onCanvasRevertEvent(() => {
    ctxRef.revert();
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
    if (ctxRef) {
    }
    let editCanvas: HTMLCanvasElement | null = document.querySelector('#editCanvas');
    if (!ctxRef || !editCanvas) return;
    // 初始化大小
    editCanvas.style.height = IMAGE_SIZE * configRef.zoom + 'px';
    editCanvas.style.width = IMAGE_SIZE * configRef.zoom + 'px';
    ctxRef.canvas.height = IMAGE_SIZE * configRef.zoom;
    ctxRef.canvas.width = IMAGE_SIZE * configRef.zoom;
    let CanvasWidth = ctxRef.canvas.width;
    let CanvasHeight = ctxRef.canvas.height;
    // 遍历的方式初始化网格
    let xLineTotals = Math.floor(CanvasWidth / configRef.gridSize); // 计算需要绘画的x轴条数
    for (let i = 0; i < xLineTotals; i++) {
      ctxRef.beginPath();
      ctxRef.moveTo(0, configRef.gridSize * i);
      ctxRef.lineTo(CanvasWidth, configRef.gridSize * i);
      ctxRef.strokeStyle = '#ccc';
      ctxRef.lineWidth = 1;
      ctxRef.stroke();
    }
    let yLineTotals = Math.floor(CanvasHeight / configRef.gridSize);
    for (let j = 0; j < yLineTotals; j++) {
      ctxRef.beginPath();
      ctxRef.moveTo(configRef.gridSize * j, 0);
      ctxRef.lineTo(configRef.gridSize * j, CanvasHeight);
      ctxRef.strokeStyle = '#ccc';
      ctxRef.lineWidth = 1;
      ctxRef.stroke();
    }
    // 重绘之前点选的内容
    setTimeout(() => {
      for (let key in props.filledMap) {
        if (props.filledMap.get(key)) {
          const [xGrid, yGrid] = key.split(',');
          ctxRef.fillStyle = 'red';
          ctxRef.fillRect(...canvasUtil.getRect(Number(xGrid), Number(yGrid)));
        }
      }
    });
  }
  // 挂载时初始化
  onMounted(() => {
    let editCanvas: HTMLCanvasElement | null = document.querySelector('#editCanvas');
    if (editCanvas == null) return;
    let ctx = editCanvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    ctxRef.setupCanvas(ctx);
    drawCanvas();
    ctxRef.save();
  });
</script>

<style scoped lang="less">
  .content-box {
    flex: 1;
    border: 1px solid #cccccc;
    margin: 10px;
    max-width: calc(100vw - 484px);
    padding: 10px;
  }

  .scroller {
    height: 100%;
    width: 100%;
    padding: 5px;
    overflow: auto;
    text-align: center;
  }

  #editCanvas {
    border: 5px solid #cccccc;
    background-repeat: no-repeat;
    background-size: contain;
  }
</style>
