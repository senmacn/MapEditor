<template>
  <a-modal
    class="display-output-modal"
    title="导出数据填充确认"
    :width="1000"
    :visible="visible"
    :mask-closable="false"
    :onCancel="handleCancel"
    :footer="null"
  >
    <a-spin tip="渲染中..." :spinning="spinningRef">
      <div class="area-choose" v-if="isFirst">
        <a-checkbox-group v-model:value="areasRef">
          <a-row v-for="layer in layersRef">
            <a-col :span="4" class="title">
              <block-outlined />
              {{ layer.name }}
            </a-col>
            <a-col :span="4" v-for="areas in layer.areas">
              <a-checkbox :value="areas.getUuid()">
                <gateway-outlined />
                {{ areas.getName() }}
              </a-checkbox>
            </a-col>
          </a-row>
        </a-checkbox-group>
      </div>
      <div v-else>
        <div id="displayModal" class="canvas-wrapper"> </div>
        <div class="tip">PS: 确认上图的区域填充（大小放缩后）是否与所画区域形状一致！</div>
      </div>
      <div class="confirm-button-group">
        <a-button
          type="primary"
          v-if="isFirst"
          :disabled="areasRef.length === 0"
          @click="handleExportBySingle"
        >
          单独导出
        </a-button>
        <a-button
          type="primary"
          v-if="isFirst"
          :disabled="areasRef.length < 2"
          @click="handleExportMixin"
        >
          合并导出
        </a-button>
        <a-button type="primary" v-if="!isFirst" @click="handleConfirmOkExport">确定</a-button>
        <a-button type="primary" v-if="!isFirst" @click="goToPrevious">返回</a-button>
        <a-button @click="handleCancel">取消</a-button>
      </div>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
  import { Ref, inject, ref, unref } from 'vue';
  import { Layer } from '../common/types';
  import { getClosedCurvePointsData, scaleImageData } from '../utils/image-data-util';
  import DownloadWorker from '@/worker/download-positions.worker?worker';
  import { getLocalApi } from '@/utils/env';
  import { useLocalState } from '@/store/modules/local-state';
  import { message, notification } from 'ant-design-vue';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { exportFile } from '@/utils/file';
  import { useStepper } from '@vueuse/core';
  import { GatewayOutlined, BlockOutlined } from '@ant-design/icons-vue';
  import { Area } from '../draw-element';
  import { max, min } from 'lodash-es';

  const emit = defineEmits<{
    (event: 'ok'): void;
    (event: 'cancel'): void;
  }>();

  defineProps({
    visible: {
      type: Boolean,
      default: false,
    },
  });

  const layersRef: Ref<Layer[]> = inject('layers', [] as any);

  const areasRef = ref<String[]>([]);
  const mixinRef = ref(false);
  const { goToNext, goToPrevious, isFirst } = useStepper([0, 1], 0);
  function handleExportBySingle() {
    mixinRef.value = false;
    goToNext();
    handleShowChooseArea();
  }
  function handleExportMixin() {
    mixinRef.value = true;
    goToNext();
    handleShowChooseArea();
  }

  let areaData: Recordable<any>[] = [];
  const spinningRef = ref(false);
  function handleShowChooseArea() {
    areaData = [];
    spinningRef.value = true;
    setTimeout(() => {
      const layers = unref(layersRef);
      // @ts-ignore
      document.getElementById('displayModal').innerHTML = '';
      const areas: Area[] = [];
      for (let index = layers.length - 1; index >= 0; index--) {
        const layer = layers[index];
        layer.areas.forEach((area) => {
          if (areasRef.value.includes(area.getUuid())) {
            areas.push(area);
          }
        });
      }
      if (mixinRef.value) {
        // 计算合并后的边框尺寸，以及单独计算填充
        const toMixinData: Recordable<any>[] = [];
        const startsX: number[] = [];
        const startsY: number[] = [];
        const endsX: number[] = [];
        const endsY: number[] = [];
        for (const area of areas) {
          const x = area.getBoundRect()[0];
          const y = area.getBoundRect()[1];
          const width = area.getBoundRect()[2];
          const height = area.getBoundRect()[3];
          startsX.push(x);
          startsY.push(y);
          endsX.push(x + width);
          endsY.push(y + height);
          toMixinData.push({
            boundRect: area.getBoundRect(),
            data: getClosedCurvePointsData(area),
          });
        }
        const x = min(startsX) || 0;
        const y = min(startsY) || 0;
        const width = max(endsX) || 0 - x;
        const height = max(endsY) || 0 - y;
        // 开始画图，先用一个离屏canvas画
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d', {
          willReadFrequently: true,
        }) as CanvasRenderingContext2D;
        for (const aData of toMixinData) {
          const { boundRect, data } = aData;
          // 临时canvas
          const cacheCanvas = document.createElement('canvas');
          cacheCanvas.width = boundRect[2];
          cacheCanvas.height = boundRect[3];
          const cacheCtx = cacheCanvas.getContext('2d', {
            willReadFrequently: true,
          }) as CanvasRenderingContext2D;
          cacheCtx.putImageData(data, 0, 0);
          // 计算偏移画入
          tempCtx.drawImage(cacheCanvas, boundRect[0] - x, boundRect[1] - y);
        }
        // 放缩展示内容
        const cacheCanvas = document.createElement('canvas');
        cacheCanvas.width = 300;
        cacheCanvas.height = 300;
        const cacheCtx = cacheCanvas.getContext('2d', {
          willReadFrequently: true,
        }) as CanvasRenderingContext2D;
        let scale = width > height ? 300 / width : 300 / height;
        cacheCtx.drawImage(tempCanvas, 0, 0, width, height, 0, 0, scale * width, scale * height);
        cacheCtx.font = '12px serif';
        cacheCtx.fillStyle = 'white';
        document.getElementById('displayModal')?.appendChild(cacheCanvas);
        areaData.push({
          name: 'test',
          boundRect: [x, y, width, height],
          data: tempCtx.getImageData(0, 0, width, height),
        });
      } else {
        for (const area of areas) {
          const cacheCanvas = document.createElement('canvas');
          cacheCanvas.width = 300;
          cacheCanvas.height = 300;
          const cacheCtx = cacheCanvas.getContext('2d', {
            willReadFrequently: true,
          }) as CanvasRenderingContext2D;
          const data = getClosedCurvePointsData(area);
          const boundRect = area.getBoundRect();
          let scale = boundRect[2] > boundRect[3] ? 300 / boundRect[2] : 300 / boundRect[3];
          cacheCtx.putImageData(scaleImageData(data, scale), 1, 1);
          cacheCtx.font = '12px serif';
          cacheCtx.fillStyle = 'white';
          cacheCtx.fillText(area.getName(), 20, 20);
          document.getElementById('displayModal')?.appendChild(cacheCanvas);
          areaData.push({
            name: area.getName(),
            boundRect: area.getBoundRect(),
            data: data,
          });
        }
      }
      spinningRef.value = false;
    }, 100);
  }

  const configRef = useEditorConfig();
  const localState = useLocalState();
  const localApi = getLocalApi();
  function handleConfirmOkExport() {
    setTimeout(() => {
      for (let aData of areaData) {
        const { name, boundRect, data } = aData;
        const worker = new DownloadWorker();
        worker.onmessage = async function (e) {
          const fileName = name + '.data.bin';
          const data = e.data;
          if (localApi) {
            const e = await localApi.saveLocalFile(fileName, data, localState.getDownloadLocation);
            if (e) {
              message.error(`区域[${name}]导出失败！`);
              console.error(e);
              return;
            }
          } else {
            exportFile(fileName, data);
          }
          notification.success({
            message: '下载坐标',
            description: `区域[${name}]下载完成！`,
          });
          worker.terminate();
        };
        worker.onerror = function (event) {
          console.error(event);
          message.error('下载失败！');
          worker.terminate();
        };
        worker.postMessage([
          data,
          boundRect[0] + Number(configRef.getSize.offsetX),
          boundRect[1] + Number(configRef.getSize.offsetY),
          Number(configRef.getSize.allX),
          Number(configRef.getSize.allY),
          Number(configRef.getSize.scale),
        ]);
        notification.info({
          message: '下载坐标',
          description: `区域[${name}]的下载已在后台进行，请勿关闭浏览器！`,
        });
      }
    }, 0);
    handleCancel();
  }

  function handleCancel() {
    goToPrevious();
    emit('cancel');
  }
</script>

<style lang="less">
  .display-output-modal {
    .canvas-wrapper {
      display: flex;
      margin: 15px auto;
      padding: 5px;
      max-width: 1000px;
      max-height: 620px;
      overflow: auto;
    }
    .area-choose {
      padding: 56px;
      .title {
        font-weight: bold;
      }
    }
    .ant-checkbox-group {
      width: 100%;
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
