<template>
  <a-modal
    class="display-output-modal"
    :width="1000"
    :visible="visible"
    :mask-closable="false"
    :onCancel="handleCancel"
    :closable="false"
    :footer="null"
  >
    <div class="modal-title">坐标下载</div>
    <a-spin tip="渲染中..." :spinning="spinningRef">
      <div class="modal-content">
        <div class="area-choose" v-if="isFirst">
          <a-checkbox-group v-model:value="areasRef">
            <a-row v-for="layer in canvasState.layers">
              <a-col :span="4" class="title">
                <block-outlined />
                {{ layer.name }}
              </a-col>
              <a-col :span="8" v-for="areas in layer.areas">
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
          <a-space class="mixin-name" v-if="mixinRef">
            合并导出区域名称: <a-input v-model:value="mixinNameRef"></a-input>
          </a-space>
          <div class="tip">PS: 确认上图的区域填充（大小放缩后）是否与所画区域形状一致！</div>
        </div>
        <div class="ant-modal-footer">
          <a-button @click="handleCancel">取消</a-button>
          <a-button type="primary" v-if="!isFirst" @click="goToPrevious">返回</a-button>
          <a-button type="primary" v-if="isFirst" :disabled="areasRef.length === 0" @click="handleExportBySingle">
            单独导出
          </a-button>
          <a-button type="primary" v-if="isFirst" :disabled="areasRef.length < 2" @click="handleExportMixin">
            合并导出
          </a-button>
          <a-button type="primary" v-if="!isFirst" @click="handleConfirmOkExport">确定</a-button>
        </div>
      </div>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { getClosedCurvePointsData, scaleImageData } from '../utils/image-data-util';
  import DownloadWorker from '@/worker/download-positions.worker?worker';
  import { getLocalApi } from '@/utils/env';
  import { useLocalState } from '@/store/modules/local-state';
  import { message, notification } from 'ant-design-vue';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { exportFile } from '@/utils/file';
  import { useStepper } from '@vueuse/core';
  import { GatewayOutlined, BlockOutlined } from '@ant-design/icons-vue';
  import type { Area } from '../draw-element';
  import { max, min } from 'lodash-es';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import { useProgressEvent } from '@/components/controlled-progress';

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

  const [start, progress] = useProgressEvent();

  const canvasState = useCanvasState();

  const areasRef = ref<string[]>([]);
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
      // @ts-ignore
      document.getElementById('displayModal').innerHTML = '';
      const areas: Area[] = [];
      for (let index = canvasState.getLayers.length - 1; index >= 0; index--) {
        const layer = canvasState.getLayers[index];
        layer.areas.forEach((area) => {
          if (areasRef.value.includes(area.getUuid())) {
            areas.push(area);
          }
        });
      }
      if (mixinRef.value) {
        mixinNameRef.value = areas.map((area) => area.getName()).join('_');
        // 计算合并后的边框尺寸，以及单独计算填充
        const toMixinData: Recordable<any>[] = [];
        const startsX: number[] = [];
        const startsY: number[] = [];
        const endsX: number[] = [];
        const endsY: number[] = [];
        for (const area of areas) {
          const x = area.getActualBoundRect()[0];
          const y = area.getActualBoundRect()[1];
          const width = area.getActualBoundRect()[2];
          const height = area.getActualBoundRect()[3];
          startsX.push(x);
          startsY.push(y);
          endsX.push(x + width);
          endsY.push(y + height);
          toMixinData.push({
            boundRect: area.getActualBoundRect(),
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
          const offscreenCanvas = new OffscreenCanvas(data.width, data.height);
          const context = <OffscreenCanvasRenderingContext2D>offscreenCanvas.getContext('2d');
          context?.putImageData(data, 0, 0);
          // 计算偏移画入
          tempCtx.drawImage(offscreenCanvas, boundRect[0] - x, boundRect[1] - y);
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
          try {
            const cacheCanvas = document.createElement('canvas');
            cacheCanvas.width = 300;
            cacheCanvas.height = 300;
            const cacheCtx = cacheCanvas.getContext('2d', {
              willReadFrequently: true,
            }) as CanvasRenderingContext2D;
            const data = getClosedCurvePointsData(area);
            const boundRect = area.getActualBoundRect();
            let scale = boundRect[2] > boundRect[3] ? 300 / boundRect[2] : 300 / boundRect[3];
            cacheCtx.putImageData(scaleImageData(data, scale), 1, 1);
            cacheCtx.font = '12px serif';
            cacheCtx.fillStyle = 'white';
            cacheCtx.fillText(area.getName(), 20, 20);
            document.getElementById('displayModal')?.appendChild(cacheCanvas);
            areaData.push({
              name: area.getName(),
              boundRect: area.getActualBoundRect(),
              data: data,
            });
          } catch (e) {
            console.error(e);
            message.warning(`区域${area.getName()}构建失败！请确认编辑数据！`);
          }
        }
      }
      spinningRef.value = false;
    }, 100);
  }

  const configRef = useEditorConfig();
  const localState = useLocalState();
  const localApi = getLocalApi();

  const mixinNameRef = ref('');
  function handleConfirmOkExport() {
    start(areaData.length);
    setTimeout(() => {
      const promises: Promise<any>[] = [];
      for (let aData of areaData) {
        promises.push(
          new Promise((resolve) => {
            const { name, boundRect, data } = aData;
            const worker = new DownloadWorker();
            worker.onmessage = async function (e) {
              const fileName = mixinRef.value ? mixinNameRef.value : name + '.data.bin';
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
              progress();
              notification.success({
                message: '下载坐标',
                description: `区域[${name}]下载完成！`,
              });
              worker.terminate();
              resolve(1);
            };
            worker.onerror = function (event) {
              console.error(event);
              message.error('下载失败！');
              worker.terminate();
            };
            worker.postMessage([
              data,
              boundRect[0] + Number(configRef.getProjectSizeConfigPxOffsetX),
              boundRect[1] + Number(configRef.getProjectSizeConfigPxOffsetY),
              Number(configRef.getProjectSizeConfigFullWidth),
              Number(configRef.getProjectSizeConfigFullHeight),
              Number(configRef.getProjectSizeConfigScale),
            ]);
            notification.info({
              message: '下载坐标',
              description: `区域[${name}]的下载已在后台进行，请勿关闭编辑器！`,
            });
          }),
        );
      }
      Promise.all(promises).then(() => {
        notification.success({
          message: '下载坐标',
          description: '所有区域下载完成！',
        });
        localApi &&
          localApi.getCustomConfig().then((config) => {
            if (config.autoOpenDownloadDirectory) {
              localApi.openFolder(localState.getDownloadLocation);
            }
          });
      });
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
    .mixin-name {
      margin: 0 auto;
      display: flex;
      width: 320px;
      margin-bottom: 10px;
    }
    .ant-checkbox-group {
      width: 100%;
    }
    canvas {
      margin: auto;
    }
    .tip {
      text-align: center;
      color: red;
      font-weight: bold;
      font-size: 12px;
    }
  }
</style>
