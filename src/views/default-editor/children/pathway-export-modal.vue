<template>
  <a-modal
    class="pathway-export-modal"
    :width="1000"
    :visible="visible"
    :mask-closable="false"
    :on-cancel="handleCancel"
    :closable="false"
    :footer="null"
  >
    <div class="modal-title">路径导出</div>
    <a-spin tip="渲染中..." :spinning="spinningRef">
      <div class="modal-content">
        <div class="area-choose">
          <a-checkbox-group v-model:value="pathwaysRef">
            <a-row v-for="layer in canvasState.layers">
              <a-col :span="4" class="title">
                <block-outlined />
                {{ layer.name }}
              </a-col>
              <a-col :span="4" v-for="pathway in layer.pathways">
                <a-checkbox :value="pathway.getUuid()">
                  <node-index-outlined />
                  {{ pathway.getName() }}
                </a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
          <!-- <a-divider /> -->
          <!-- <a-checkbox v-model:value="useBackgroundRef"
            >导出包含底图(选中时，请不要同时选中多层图层路径合并导出，否则可能会出现底图覆盖)</a-checkbox
          > -->
        </div>
        <div class="ant-modal-footer">
          <a-button @click="handleCancel">取消</a-button>
          <a-button type="primary" :disabled="pathwaysRef.length === 0" @click="handleExport"> 导出 </a-button>
        </div>
      </div>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
  import type { Pathway } from '../draw-element';
  import { ref } from 'vue';
  import { getLocalApi } from '@/utils/env';
  import { useLocalState } from '@/store/modules/local-state';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { NodeIndexOutlined, BlockOutlined } from '@ant-design/icons-vue';
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
  const useBackgroundRef = ref(false);

  const canvasState = useCanvasState();
  const configRef = useEditorConfig();
  const localState = useLocalState();
  const localApi = getLocalApi();

  const pathwaysRef = ref<string[]>([]);

  function handleExport() {
    spinningRef.value = true;
    new Promise((resolve) => {
      setTimeout(async () => {
        const layers = canvasState.getLayers;
        const pathways: Pathway[] = [];
        for (let index = layers.length - 1; index >= 0; index--) {
          const layer = layers[index];
          layer.pathways.forEach((pathway) => {
            if (pathwaysRef.value.includes(pathway.getUuid())) {
              pathways.push(pathway);
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

        // 合并下载
        // 绘制背景
        if (useBackgroundRef.value && pathways[0].layer?.map) {
          const image = await dataURLToImage(pathways[0].layer?.map as string);
          // 暂时先填满
          pathways[0].layer?.map && fullCtx.drawImage(image, 0, 0, fullCanvas.width, fullCanvas.height);
        }
        for (const pathway of pathways) {
          const boundRect = pathway.getActualBoundRect();
          // putImageData会相互覆盖，使用drawImage
          const initData = pathway.getData();
          const offscreenCanvas = new OffscreenCanvas(initData.width, initData.height);
          const context = <OffscreenCanvasRenderingContext2D>offscreenCanvas.getContext('2d', {
            willReadFrequently: true,
          });
          context?.putImageData(initData, 0, 0);
          fullCtx.drawImage(offscreenCanvas, boundRect[0], boundRect[1]);
        }

        const actorPxWidth = configRef.getProjectSizeConfig.actorPxWidth;
        // 计算分块
        const startX = configRef.getProjectSizeConfigPxOffsetX / actorPxWidth;
        const startY = configRef.getProjectSizeConfigPxOffsetY / actorPxWidth;
        const maxX = configRef.getProjectSizeConfigPxWidth / actorPxWidth;
        const maxY = configRef.getProjectSizeConfigPxHeight / actorPxWidth;
        // 分块离屏canvas
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = actorPxWidth;
        sliceCanvas.height = actorPxWidth;
        const sliceCtx = sliceCanvas.getContext('2d', {
          willReadFrequently: true,
        }) as CanvasRenderingContext2D;
        for (let indexY = 0; indexY < maxY; indexY++) {
          for (let indexX = 0; indexX < maxX; indexX++) {
            sliceCtx.putImageData(
              fullCtx.getImageData(actorPxWidth * indexX, actorPxWidth * indexY, actorPxWidth, actorPxWidth),
              0,
              0,
            );
            await canvasToFile(sliceCanvas, 'image/png', 1).then((blob) => {
              if (!blob) {
                message.warning('构建图片数据为空，请检查区域或尺寸设置！');
              }
              blob?.arrayBuffer().then((buffer) => {
                localApi?.saveLocalFile(
                  `${startX + indexX}-${startY + indexY}.png`,
                  buffer as Buffer,
                  localState.getDownloadLocation,
                );
              });
            });
            sliceCtx.clearRect(0, 0, actorPxWidth, actorPxWidth);
          }
        }
        resolve(null);
      });
    })
      .then(() => {
        // TODO: 自动打开文件夹（在设置中配置）
        message.success('下载成功！');
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
  .pathway-export-modal {
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
