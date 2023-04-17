<template>
  <canvas :id="canvasId" width="5000" height="5000" @click="handleClick" :style="style"></canvas>
</template>

<script setup lang="ts">
  import type { Layer } from './common/types';
  import { onMounted, watch } from 'vue';
  import * as canvasUtil from './common/canvas-util';
  import useCanvas from './hooks/useCanvas';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { emitClickAreaEvent } from './common/event';
  import controller from './common/canvas-state-controller';
  import { nextTick } from 'vue';

  const props = defineProps({
    posKey: {
      type: Array as PropType<number[]>,
      default: [0, 0],
    },
    layer: {
      type: Object as PropType<Layer>,
    },
  });

  const canvasId = props.layer?.uuid + '-' + props.posKey[0] + '-' + props.posKey[1];
  const style = `top: ${props.posKey[1] * 5000}px; left: ${props.posKey[0] * 5000}px;`;

  // canvas相关
  const ctxRef = useCanvas();
  const configRef = useEditorConfig();

  // 初始化
  let setUpState = false;
  function setup() {
    if (!props.layer || setUpState) return;
    let defaultCanvas: HTMLCanvasElement = document.getElementById(canvasId) as HTMLCanvasElement;
    if (defaultCanvas == null) return;
    const flag = configRef.size.x > 5000 || configRef.size.y > 5000;
    defaultCanvas.width = flag ? 5000 : configRef.size.x;
    defaultCanvas.height = flag ? 5000 : configRef.size.y;
    let ctx = defaultCanvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    ctxRef.setupCanvas(ctx);
    ctxRef.setOffset({ x: props.posKey[0] * 5000, y: props.posKey[1] * 5000 });
    // drawCanvas();

    props.layer.ctxs?.push(ctxRef);
    setUpState = true;
  }
  // 挂载或者显示时初始化
  onMounted(() => {
    setup();
  });
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

  function handleClick(e: MouseEvent) {
    if (props.layer?.areas && props.layer.areas.length > 0) {
      let areas: any[] = [];
      for (const area of props.layer.areas) {
        if (
          area.checkPointInArea(canvasUtil.getPos(e), {
            x: props.posKey[0] * 5000,
            y: props.posKey[1] * 5000,
          })
        ) {
          areas.push(area);
        }
      }
      if (areas.length > 0) {
        // 先重置，否则mask-area的offset会错误
        controller.setCurrentArea(null);
        nextTick(() => {
          controller.setCurrentArea(areas[0]);
          emitClickAreaEvent(areas[0]);
        });
      } else {
        controller.setCurrentArea(null);
      }
    }
  }

  // zoom配置修改时，修改canvas大小
  // watch(
  //   () => configRef.zoom,
  //   () => {
  //     if (configRef) {
  //       const layer = document.getElementById(canvasId);
  //       if (!layer) return;
  //       const style = canvasUtil.getZoomChangeStyle(configRef.zoom);
  //       layer.style.setProperty('transform', style.transform);
  //       layer.style.setProperty('top', style.top);
  //       layer.style.setProperty('left', style.left);
  //     }
  //   },
  // );
  watch(
    () => controller.isEditingArea(),
    () => {
      let defaultCanvas: HTMLCanvasElement = document.getElementById(canvasId) as HTMLCanvasElement;
      if (defaultCanvas == null) return;
      if (controller.isEditingArea()) {
        defaultCanvas.style.visibility = 'hidden';
      } else {
        defaultCanvas.style.visibility = 'visible';
      }
    },
  );
</script>

<style scoped lang="less">
  canvas {
    position: absolute;
    /* border: 1px dotted black; */
  }
</style>
