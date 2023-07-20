<template>
  <a-modal
    class="choose-area-point-modal"
    :width="800"
    :visible="visibleRef"
    :mask-closable="false"
    :closable="false"
    :footer="null"
  >
    <div class="modal-title">区域内部点确认</div>
    <a-spin tip="渲染中..." :spinning="spinningRef">
      <div class="modal-content">
        <div class="tip">
          <info-circle-outlined></info-circle-outlined>
          请点选区域内部一点，完成内部点填充预览！
        </div>
        <div class="canvas-wrapper">
          <canvas
            v-show="!pointRef"
            ref="baseCanvasRef"
            class="base-canvas"
            width="500"
            height="500"
            @click.stop="handleChangePoint"
          />
          <canvas
            v-show="!!pointRef"
            ref="confirmCanvasRef"
            class="confirm-canvas"
            width="500"
            height="500"
          />
        </div>
        <div class="ant-modal-footer">
          <a-button @click="handleCancel">取消</a-button>
          <a-button type="primary" @click="handleRevert">重选</a-button>
          <a-button type="primary" @click="handleConfirmOk">确定</a-button>
        </div>
      </div>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { scaleImageData, copyImageData } from '../utils/image-data-util';
  import { InfoCircleOutlined } from '@ant-design/icons-vue';
  import FloodFill from '@/utils/q-floodfill';
  import { message } from 'ant-design-vue';

  const emit = defineEmits<{
    (
      event: 'confirm-end',
      point: [number, number] | null,
      data: any,
      rect: any,
      cancel: boolean,
    ): void;
  }>();

  let imageData;
  let outData;

  const spinningRef = ref(false);
  const visibleRef = ref(false);

  const baseCanvasRef = ref<HTMLCanvasElement>();
  const baseCtxRef = ref<CanvasRenderingContext2D>();
  const confirmCanvasRef = ref<HTMLCanvasElement>();
  const confirmCtxRef = ref<CanvasRenderingContext2D>();

  let scale = 1.0;
  // 初始化
  function setUpConfirmArea({ data, boundRect }: { data: ImageData; boundRect: Box }) {
    visibleRef.value = true;
    setTimeout(() => {
      imageData = data;
      scale = boundRect[2] > boundRect[3] ? 500 / boundRect[2] : 500 / boundRect[3];
      if (baseCanvasRef.value) {
        baseCtxRef.value = baseCanvasRef.value.getContext('2d', {
          willReadFrequently: true,
        }) as CanvasRenderingContext2D;
        baseCtxRef.value.clearRect(0, 0, 600, 600);
        baseCtxRef.value.putImageData(scaleImageData(data, scale), 0, 0);
      }
      if (confirmCanvasRef.value) {
        confirmCtxRef.value = confirmCanvasRef.value.getContext('2d', {
          willReadFrequently: true,
        }) as CanvasRenderingContext2D;
      }
    }, 50);
  }
  defineExpose({ setUpConfirmArea });

  const pointRef = ref<[number, number] | null>(null);
  function handleChangePoint(e: MouseEvent) {
    if (pointRef.value) {
      return;
    }
    spinningRef.value = true;
    pointRef.value = [e.offsetX, e.offsetY];
    if (!baseCtxRef.value) return;
    // 从点击位置开始计算
    setTimeout(() => {
      const _data = copyImageData(imageData);
      const floodFill = new FloodFill(_data, true);
      try {
        floodFill.fill(
          `rgba(29, 180, 64, 0.75)`,
          Math.round(e.offsetX / scale),
          Math.round(e.offsetY / scale),
          0,
        );
      } catch (e) {
        pointRef.value = null;
        message.error('无效的点！');
        spinningRef.value = false;
      }

      confirmCtxRef.value?.putImageData(scaleImageData(floodFill.imageData, scale), 0, 0);
      outData = floodFill;
      setTimeout(() => (spinningRef.value = false), 200);
    });
  }

  function handleRevert() {
    confirmCtxRef.value?.clearRect(0, 0, 500, 500);
    pointRef.value = null;
  }

  function handleConfirmOk() {
    visibleRef.value = false;
    confirmCtxRef.value?.clearRect(0, 0, 500, 500);
    emit(
      'confirm-end',
      // @ts-ignore
      [Math.round(pointRef.value[0] / scale), Math.round(pointRef.value[1] / scale)],
      // @ts-ignore
      ...outData.getImageDataFrom(imageData),
      false,
    );
    pointRef.value = null;
  }

  function handleCancel() {
    visibleRef.value = false;
    confirmCtxRef.value?.clearRect(0, 0, 500, 500);
    emit('confirm-end', null, null, null, true);
    pointRef.value = null;
  }
</script>

<style lang="less">
  .choose-area-point-modal {
    .canvas-wrapper {
      position: relative;
      margin: 15px auto;
      padding: 5px;
      width: 500px;
      height: 500px;
      overflow: auto;
    }
    .modal-content {
      padding: 36px 56px 56px;
    }
    .tip {
      text-align: center;
      font-size: 12px;
    }
    .base-canvas {
      position: absolute;
      top: 0;
      left: 0;
      cursor: crosshair;
    }
    .confirm-canvas {
      pointer-events: none;
      position: absolute;
      top: 0;
      left: 0;
    }
  }
</style>
