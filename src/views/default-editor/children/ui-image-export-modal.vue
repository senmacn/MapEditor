<template>
  <a-modal
    class="ui-image-export-modal"
    :width="1000"
    :visible="visible"
    :mask-closable="false"
    :on-cancel="handleCancel"
    :closable="false"
    :footer="null"
  >
    <div class="modal-title">UI图下载</div>
    <a-spin tip="渲染中..." :spinning="spinningRef">
      <div class="modal-content">
        <div class="area-choose">
          <a-checkbox-group v-model:value="areasRef">
            <a-row v-for="layer in canvasState.layers">
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
          <div class="tip">PS: 合并导出仅支持同一图层的区域合并导出！选择不同图层合并导出时，可能会出现覆盖！</div>
        </div>
        <div class="ant-modal-footer">
          <a-button @click="handleCancel">取消</a-button>
          <a-button type="primary" :disabled="areasRef.length === 0" @click="handleExportBySingle"> 单独下载 </a-button>
          <a-button type="primary" :disabled="areasRef.length < 2" @click="handleExportMixin"> 合并下载 </a-button>
        </div>
      </div>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
  import type Area from '../draw-element/area';
  import { ref } from 'vue';
  import { getLocalApi } from '@/utils/env';
  import { useLocalState } from '@/store/modules/local-state';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { GatewayOutlined, BlockOutlined } from '@ant-design/icons-vue';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import { message } from 'ant-design-vue';
  import { canvasToFile, dataURLToImage } from '@/utils/file/image';

  const emit = defineEmits<{
    (event: 'close'): void;
  }>();

  defineProps({
    visible: {
      type: Boolean,
      default: false,
    },
  });

  const spinningRef = ref(false);

  const canvasState = useCanvasState();
  const configRef = useEditorConfig();
  const localState = useLocalState();
  const localApi = getLocalApi();

  const areasRef = ref<string[]>([]);
  const mixinRef = ref(false);

  function handleExportBySingle() {
    mixinRef.value = false;
    handleShowChooseArea();
  }

  function handleExportMixin() {
    mixinRef.value = true;
    handleShowChooseArea();
  }

  function handleShowChooseArea() {
    spinningRef.value = true;
    new Promise((resolve) => {
      setTimeout(async () => {
        const layers = canvasState.getLayers;
        const areas: Area[] = [];
        for (let index = layers.length - 1; index >= 0; index--) {
          const layer = layers[index];
          layer.areas.forEach((area) => {
            if (areasRef.value.includes(area.getUuid())) {
              areas.push(area);
            }
          });
        }
        // 离屏canvas
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = configRef.getProjectSizeConfigPxWidth;
        fullCanvas.height = configRef.getProjectSizeConfigPxHeight;
        const fullCtx = fullCanvas.getContext('2d', {
          willReadFrequently: true,
        }) as CanvasRenderingContext2D;
        if (mixinRef.value) {
          // 合并下载
          // 绘制背景
          if (areas[0].layer?.map) {
            const image = await dataURLToImage(areas[0].layer?.map as string);
            // 暂时先填满
            areas[0].layer?.map && fullCtx.drawImage(image, 0, 0, fullCanvas.width, fullCanvas.height);
          }
          for (const area of areas) {
            const boundRect = area.getActualBoundRect();
            // putImageData会相互覆盖，使用drawImage
            const initData = area.getData();
            const offscreenCanvas = new OffscreenCanvas(initData.width, initData.height);
            const context = <OffscreenCanvasRenderingContext2D>offscreenCanvas.getContext('2d', {
              willReadFrequently: true,
            });
            context?.putImageData(initData, 0, 0);
            fullCtx.drawImage(offscreenCanvas, boundRect[0], boundRect[1]);
          }
          await canvasToFile(fullCanvas, 'image/png', 1).then((blob) => {
            if (!blob) {
              message.warning('构建图片数据为空，请检查区域或尺寸设置！');
            }
            blob?.arrayBuffer().then((buffer) => {
              localApi?.saveLocalFile('UI合并下载.png', buffer as Buffer, localState.getUIExportLocation);
            });
          });
          resolve(null);
        } else {
          // 单独下载
          for (const area of areas) {
            // 绘制背景
            if (areas[0].layer?.map) {
              const image = await dataURLToImage(areas[0].layer?.map as string);
              areas[0].layer?.map && fullCtx.drawImage(image, 0, 0);
            }
            const boundRect = area.getActualBoundRect();
            // putImageData会相互覆盖，使用drawImage
            const initData = area.getData();
            const offscreenCanvas = new OffscreenCanvas(initData.width, initData.height);
            const context = <OffscreenCanvasRenderingContext2D>offscreenCanvas.getContext('2d', {
              willReadFrequently: true,
            });
            context?.putImageData(initData, 0, 0);
            fullCtx.drawImage(offscreenCanvas, boundRect[0], boundRect[1]);
            await canvasToFile(fullCanvas, 'image/png', 1).then((blob) => {
              if (!blob) {
                message.warning('构建图片数据为空，请检查区域或尺寸设置！');
              }
              blob?.arrayBuffer().then((buffer) => {
                localApi?.saveLocalFile(area.getName() + '.png', buffer as Buffer, localState.getUIExportLocation);
              });
            });
            // 清空
            fullCtx.clearRect(0, 0, fullCanvas.width, fullCanvas.height);
          }
          resolve(null);
        }
      });
    })
      .then(() => {
        message.success('下载成功！');

        localApi &&
          localApi.getCustomConfig().then((config) => {
            if (config.autoOpenDownloadDirectory) {
              localApi.openFolder(localState.getUIExportLocation);
            }
          });
      })
      .catch((e) => {
        console.error(e);
        message.error('下载失败！' + e.message);
      })
      .finally(() => {
        spinningRef.value = false;
      });
  }

  function handleCancel() {
    emit('close');
  }
</script>

<style lang="less">
  .ui-image-export-modal {
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
