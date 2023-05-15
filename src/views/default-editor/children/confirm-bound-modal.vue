<template>
  <a-modal
    class="confirm-modal"
    title="区域边缘点确认"
    :width="800"
    :visible="visibleRef"
    :mask-closable="false"
    :onCancel="handleCancel"
    :footer="null"
  >
    <div class="canvas-wrapper">
      <canvas ref="confirmCanvasRef" width="600" height="600"></canvas>
    </div>
    <div class="confirm-button-group">
      <a-button type="primary" @click="handleConfirmOk">确定</a-button>
      <a-button disabled type="primary">手动选择</a-button>
      <!-- <a-button>预览</a-button> -->
      <!-- <a-button>撤销</a-button> -->
      <a-button @click="handleCancel">取消</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { ref, unref } from 'vue';
  import { getPosition, mixinData, scaleImageData } from '../common/image-data-util';
  import { maxBy, minBy } from 'lodash-es';

  const emit = defineEmits<{
    (event: 'confirm-end', data: ImageData | null, cancel: boolean): void;
  }>();

  const configRef = useEditorConfig();

  const confirmCanvasRef = ref<HTMLCanvasElement>();
  const confirmCtxRef = ref<CanvasRenderingContext2D>();
  const visibleRef = ref(false);
  const dataRef = ref<ImageData>();
  const selectVisibleRef = ref({
    top: false,
    right: false,
    bottom: false,
    left: false,
    topLeft: false,
    topRight: false,
    bottomLeft: false,
    bottomRight: false,
  });
  // 存储一些计算
  let points: Point[] = [];
  let _boundRect: Box = [0, 0, 0, 0];
  let mixedData: ImageData;
  let scale = 1.0;

  // 初始化
  function setUpConfirmArea({ data, boundRect }: { data: ImageData; boundRect: Box }) {
    visibleRef.value = true;
    dataRef.value = data;
    Object.assign(_boundRect, boundRect);
    points = getPosition(dataRef.value);
    scale = boundRect[2] > boundRect[3] ? 500 / boundRect[2] : 500 / boundRect[3];

    // 计算哪些边缘（点）可以选择
    const selectVisible = unref(selectVisibleRef);
    const topFlag = _boundRect[1] === 0;
    const rightFlag = _boundRect[0] + _boundRect[2] >= Number(configRef.getSize.x);
    const bottomFlag = _boundRect[1] + _boundRect[3] >= Number(configRef.getSize.y);
    const leftFlag = _boundRect[0] === 0;
    const flagCount = Number(topFlag) + Number(rightFlag) + Number(bottomFlag) + Number(leftFlag);
    if (flagCount === 1) {
      // 只有一条边缘有点
      selectVisible.top = topFlag;
      selectVisible.right = rightFlag;
      selectVisible.bottom = bottomFlag;
      selectVisible.left = leftFlag;
    } else if (flagCount == 2) {
      // 两条边缘有点
      if (topFlag && rightFlag) {
        selectVisible.top = true;
        selectVisible.right = true;
        selectVisible.topRight = true;
      } else if (rightFlag && bottomFlag) {
        selectVisible.right = true;
        selectVisible.bottom = true;
        selectVisible.bottomRight = true;
      } else if (bottomFlag && leftFlag) {
        selectVisible.bottom = true;
        selectVisible.left = true;
        selectVisible.bottomLeft = true;
      } else if (leftFlag && topFlag) {
        selectVisible.left = true;
        selectVisible.top = true;
        selectVisible.topLeft = true;
      } else {
        // TODO: 暂时先不考虑
      }
    } else {
      // TODO: 暂时先不考虑
    }

    executeBoundSelected(flagCount);
  }
  defineExpose({ setUpConfirmArea });

  function executeBoundSelected(flagCount: number) {
    const data = unref(dataRef);
    if (!data) return;
    const selectVisible = unref(selectVisibleRef);
    const _points: Point[] = [];
    if (flagCount === 1) {
      // 根据上右下左类型判断计算 x y 坐标
      if (selectVisible.top) {
        const boundPoints = points.filter((p) => p[1] === 0);
        const max = maxBy(boundPoints, (p) => p[0]) as Point;
        const min = minBy(boundPoints, (p) => p[0]) as Point;
        for (let index = min[0] + 1; index < max[0]; index++) {
          _points.push([index, 0]);
        }
      }
      if (selectVisible.right) {
        // 对于坐标需要-1(0 ===> length -1)
        const boundPoints = points.filter((p) => p[0] >= _boundRect[2] - 1);
        const max = maxBy(boundPoints, (p) => p[1]) as Point;
        const min = minBy(boundPoints, (p) => p[1]) as Point;
        for (let index = min[1] + 1; index < max[1]; index++) {
          _points.push([_boundRect[2] - 1, index]);
        }
      }
      if (selectVisible.bottom) {
        // 对于坐标需要-1(0 ===> length -1)
        const boundPoints = points.filter((p) => p[1] >= _boundRect[3] - 1);
        const max = maxBy(boundPoints, (p) => p[0]) as Point;
        const min = minBy(boundPoints, (p) => p[0]) as Point;
        for (let index = min[0] + 1; index < max[0]; index++) {
          _points.push([index, _boundRect[3] - 1]);
        }
      }
      if (selectVisible.left) {
        const boundPoints = points.filter((p) => p[0] === 0);
        const max = maxBy(boundPoints, (p) => p[1]) as Point;
        const min = minBy(boundPoints, (p) => p[1]) as Point;
        for (let index = min[1] + 1; index < max[1]; index++) {
          _points.push([0, index]);
        }
      }
    } else if (flagCount === 2) {
      // 将上述上右下左单边加上四个角的点组合起来
      if (selectVisible.topLeft) {
        // 上边、左边和左上角端点
        const topBoundPoints = points.filter((p) => p[1] === 0);
        const topMax = maxBy(topBoundPoints, (p) => p[0]) as Point;
        for (let index = 0; index < topMax[0]; index++) {
          _points.push([index, 0]);
        }
        const leftBoundPoints = points.filter((p) => p[0] === 0);
        const leftMax = maxBy(leftBoundPoints, (p) => p[1]) as Point;
        for (let index = 0; index < leftMax[1]; index++) {
          _points.push([0, index]);
        }
      }
      if (selectVisible.topRight) {
        // 上边、右边和右上角端点
        const topBoundPoints = points.filter((p) => p[1] === 0);
        const topMin = minBy(topBoundPoints, (p) => p[0]) as Point;
        for (let index = topMin[0]; index <= _boundRect[2] - 1; index++) {
          _points.push([index, 0]);
        }
        const rightBoundPoints = points.filter((p) => p[0] >= _boundRect[2] - 1);
        const rightMax = maxBy(rightBoundPoints, (p) => p[1]) as Point;
        for (let index = 0; index < rightMax[1]; index++) {
          _points.push([_boundRect[2] - 1, index]);
        }
      }
      if (selectVisible.bottomRight) {
        // 底边、右边和右下端点
        const bottomBoundPoints = points.filter((p) => p[1] === _boundRect[3] - 1);
        const bottomMin = minBy(bottomBoundPoints, (p) => p[0]) as Point;
        for (let index = bottomMin[0]; index <= _boundRect[2] - 1; index++) {
          _points.push([index, _boundRect[3] - 1]);
        }
        const rightBoundPoints = points.filter((p) => p[0] >= _boundRect[2] - 1);
        const rightMax = minBy(rightBoundPoints, (p) => p[1]) as Point;
        for (let index = rightMax[1]; index < _boundRect[3] - 1; index++) {
          _points.push([_boundRect[2] - 1, index]);
        }
      }
      if (selectVisible.bottomLeft) {
        // 底边、左边和左下端点
        const bottomBoundPoints = points.filter((p) => p[1] === _boundRect[3] - 1);
        const bottomMax = maxBy(bottomBoundPoints, (p) => p[0]) as Point;
        for (let index = 0; index <= bottomMax[0]; index++) {
          _points.push([index, _boundRect[3] - 1]);
        }
        const leftBoundPoints = points.filter((p) => p[0] === 0);
        const leftMin = minBy(leftBoundPoints, (p) => p[1]) as Point;
        for (let index = leftMin[1]; index < _boundRect[3] - 1; index++) {
          _points.push([0, index]);
        }
      }
    } else {
      // TODO: 暂时先不考虑
    }
    mixedData = mixinData(data, _points);
    if (confirmCanvasRef.value) {
      confirmCtxRef.value = confirmCanvasRef.value.getContext('2d', {
        willReadFrequently: true,
      }) as CanvasRenderingContext2D;
    }
    confirmCtxRef.value?.putImageData(scaleImageData(mixedData, scale), 0, 0);
    // confirmCtxRef.value?.putImageData(mixedData, 0, 0);
  }

  function handleConfirmOk() {
    visibleRef.value = false;
    confirmCtxRef.value?.clearRect(0, 0, 500, 500);
    emit('confirm-end', mixedData, false);
  }

  function handleCancel() {
    visibleRef.value = false;
    confirmCtxRef.value?.clearRect(0, 0, 500, 500);
    Object.keys(selectVisibleRef.value).forEach((key) =>
      Reflect.set(selectVisibleRef.value, key, false),
    );
    emit('confirm-end', null, true);
  }
</script>

<style lang="less">
  .confirm-modal {
    .canvas-wrapper {
      display: flex;
      margin: 15px auto;
      padding: 5px;
      max-width: 610px;
      max-height: 610px;
      overflow: auto;
    }
    canvas {
      margin: auto;
      border: 1px dotted rgb(128, 128, 128);
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
