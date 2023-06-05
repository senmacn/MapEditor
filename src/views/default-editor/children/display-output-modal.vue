<template>
  <a-modal
    class="display-output-modal"
    title="导出数据填充确认"
    :width="800"
    :visible="visible"
    :mask-closable="false"
    :onCancel="handleCancel"
    :footer="null"
  >
    <a-spin tip="渲染中..." :spinning="spinningRef">
      <div id="displayModal" class="canvas-wrapper"> </div>
      <div class="tip">PS: 确认上图的区域填充（大小放缩后）是否与所画区域形状一致！</div>
      <div class="confirm-button-group">
        <a-button type="primary" @click="handleConfirmOk">确定</a-button>
        <a-button @click="handleCancel">取消</a-button>
      </div>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
  import { Ref, inject, ref, unref, watch } from 'vue';
  import { Layer } from '../common/types';
  import { getClosedCurvePointsData, scaleImageData } from '../utils/image-data-util';

  const emit = defineEmits<{
    (event: 'ok'): void;
    (event: 'cancel'): void;
  }>();

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false,
    },
  });

  const layersRef: Ref<Layer[]> = inject('layers', [] as any);

  const spinningRef = ref(false);
  watch(
    () => props.visible,
    () => {
      if (props.visible) {
        spinningRef.value = true;
        setTimeout(() => {
          const layers = unref(layersRef);
          // @ts-ignore
          document.getElementById('displayModal').innerHTML = '';
          for (let index = layers.length - 1; index >= 0; index--) {
            const layer = layers[index];
            if (layer.visible && layer.hot) {
              layer.areas.forEach((area) => {
                const cacheCanvas = document.createElement('canvas');
                cacheCanvas.width = 200;
                cacheCanvas.height = 200;
                const cacheCtx = cacheCanvas.getContext('2d', {
                  willReadFrequently: true,
                }) as CanvasRenderingContext2D;
                const data = getClosedCurvePointsData(area);
                const boundRect = area.getBoundRect();
                let scale = boundRect[2] > boundRect[3] ? 200 / boundRect[2] : 200 / boundRect[3];
                cacheCtx.putImageData(scaleImageData(data, scale), 1, 1);
                cacheCtx.font = '12px serif';
                cacheCtx.fillStyle = 'white';
                cacheCtx.fillText(area.getName(), 20, 20);
                document.getElementById('displayModal')?.appendChild(cacheCanvas);
              });
            }
          }
          spinningRef.value = false;
        }, 100);
      }
    },
    {
      immediate: true,
    },
  );

  function handleConfirmOk() {
    emit('ok');
  }

  function handleCancel() {
    emit('cancel');
  }
</script>

<style lang="less">
  .display-output-modal {
    .canvas-wrapper {
      display: flex;
      margin: 15px auto;
      padding: 5px;
      max-width: 620px;
      max-height: 620px;
      overflow: auto;
    }
    canvas {
      margin: auto;
    }
    .tip {
      text-align: center;
    }
    .confirm-button-group {
      display: flex;
      justify-content: space-around;
      align-items: center;
      width: 50%;
      height: 80px;
      margin: 0 auto;
    }
  }
</style>
