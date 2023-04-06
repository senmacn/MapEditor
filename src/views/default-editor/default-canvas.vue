<template>
  <canvas :id="layer?.uuid" width="1000" height="1000" @click="handleClick"></canvas>
</template>

<script setup lang="ts">
  import type { Layer } from './common/types';
  import { onMounted, watch } from 'vue';
  import * as canvasUtil from './common/canvas-util';
  import useCanvas from './hooks/useCanvas';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { emitClickAreaEvent } from './common/event';
  import controller from './common/canvas-state-controller';

  const props = defineProps({
    layer: {
      type: Object as PropType<Layer>,
    },
  });

  // canvas相关
  const ctxRef = useCanvas();
  const configRef = useEditorConfig();

  // 背景图片
  watch(
    () => props.layer?.map,
    () => {
      if (props.layer) {
        const layer = document.getElementById(props.layer?.uuid);
        if (!layer) return;
        layer.style.setProperty('background-image', 'url(' + props.layer?.map + ')');
      }
    },
  );
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
    ctxRef.setupCanvas(ctx);
    // drawCanvas();

    props.layer.ctx = ctxRef;
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
        if (area.checkPointInArea(canvasUtil.getPos(e))) {
          areas.push(area);
        }
      }
      if (areas.length > 0) {
        controller.setCurrentArea(areas[0]);
        emitClickAreaEvent(areas[0]);
      } else {
        controller.setCurrentArea(null);
      }
    }
  }

  // 添加区域时渲染
  watch(
    () => props.layer?.areas,
    () => {
      if (props.layer?.areas) {
        for (let index = 0; index < props.layer.areas.length; index++) {
          const area = props.layer.areas[index];
          if (!area.getDrawAreaComplete) {
            if (ctxRef.mixin(area.getData())) {
              area.drawAreaComplete();
            } else {
              props.layer.areas.splice(index, 1);
            }
          }
        }
      }
    },
    { deep: true },
  );

  // zoom配置修改时，修改canvas大小
  watch(
    () => configRef.zoom,
    () => {
      if (configRef) {
        const layer = document.getElementById(props.layer?.uuid || '');
        if (!layer) return;
        const style = canvasUtil.getZoomChangeStyle(configRef.zoom);
        layer.style.setProperty('transform', style.transform);
        layer.style.setProperty('top', style.top);
        layer.style.setProperty('left', style.left);
      }
    },
  );
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
