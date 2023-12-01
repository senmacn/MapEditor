<template>
  <a-modal
    class="color-image-modal"
    title="色值处理"
    :width="1000"
    :visible="visible"
    :mask-closable="false"
    :onCancel="handleCancel"
    :footer="null"
  >
    <a-spin tip="渲染中..." :spinning="spinningRef">
      <div class="modal-content">
        <a-space class="config-box" direction="vertical" size="large">
          <a-row>
            <a-col :span="4"> 色值图前缀 </a-col>
            <a-col :span="8">
              <a-input v-model:value="exportRef" />
            </a-col>
          </a-row>
          <a-row>
            <a-tooltip title="区域的最大数量，下列区域填写的色值 / 区域总数量 = 实际亮度">
              <a-col :span="4">
                区域总数量
                <info-circle-outlined class="warning-color" />
              </a-col>
            </a-tooltip>
            <a-col :span="8">
              <a-input-number v-model:value="totalAreasRef" :max="100" :min="1" :step="1" />
            </a-col>
          </a-row>
        </a-space>
        <a-divider plain>导出区域选择与色值填充设置</a-divider>
        <a-checkbox-group v-model:value="areasRef">
          <a-row v-for="layer in canvasState.layers">
            <a-col :span="4" class="title">
              <block-outlined />
              {{ layer.name }}
            </a-col>
            <a-col :span="10" v-for="area in layer.areas">
              <a-checkbox :value="area.getUuid()">
                <gateway-outlined />
                {{ area.getName() }}
              </a-checkbox>
              <a-input-number v-model:value="areasColorValueRef[area.getUuid()]" :max="100" :min="1" :step="1">
                {{ area.getName() }}
              </a-input-number>
            </a-col>
          </a-row>
        </a-checkbox-group>
      </div>
      <div class="ant-modal-footer">
        <a-button @click="handleCancel">取消</a-button>
        <a-button type="primary" @click="handleExportColorImage" :disabled="areasRef.length === 0"> 导出 </a-button>
      </div>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
  import type { Area } from '../draw-element';
  import { ref } from 'vue';
  import { GatewayOutlined, BlockOutlined } from '@ant-design/icons-vue';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { changeAreaBoundaryColor, getClosedCurvePointsData } from '../utils/image-data-util';
  import { exportFile } from '@/utils/file';
  import { message } from 'ant-design-vue';
  import { InfoCircleOutlined } from '@ant-design/icons-vue';
  import { getLocalApi } from '@/utils/env';
  import { useLocalState } from '@/store/modules/local-state';
  import { hsbToRgba } from '@/utils/color';

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

  const canvasState = useCanvasState();
  const configRef = useEditorConfig();
  const localApi = getLocalApi();
  const localState = useLocalState();

  const exportRef = ref('');
  const totalAreasRef = ref(100);
  const areasRef = ref<string[]>([]);
  const areasColorValueRef = ref<Recordable<number>>({});
  const spinningRef = ref(false);

  function handleExportColorImage() {
    spinningRef.value = true;
    setTimeout(async () => {
      try {
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
        // 开始画图，先用一个离屏canvas画
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = configRef.getProjectSizeConfigPxWidth;
        fullCanvas.height = configRef.getProjectSizeConfigPxHeight;
        const fullCtx = fullCanvas.getContext('2d', {
          willReadFrequently: true,
        }) as CanvasRenderingContext2D;
        for (const area of areas) {
          // 计算色值
          const colorRGB = hsbToRgba(0, 0, areasColorValueRef.value[area.getUuid()] / totalAreasRef.value);
          const data = getClosedCurvePointsData(area, [...colorRGB]);
          changeAreaBoundaryColor(data, colorRGB);
          // putImageData会相互覆盖，使用drawImage
          const offscreenCanvas = new OffscreenCanvas(data.width, data.height);
          const context = <OffscreenCanvasRenderingContext2D>offscreenCanvas.getContext('2d', {
            willReadFrequently: true,
          });
          context?.putImageData(data, 0, 0);
          fullCtx.drawImage(offscreenCanvas, area.getActualBoundRect()[0], area.getActualBoundRect()[1]);
        }
        // 分块导出准备
        const blockWith = configRef.getProjectSizeConfig.actorPxWidth;
        const blocksX = configRef.getProjectSizeConfigPxWidth / blockWith;
        const blocksY = configRef.getProjectSizeConfigPxHeight / blockWith;
        // 创建临时canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = blockWith;
        tempCanvas.height = blockWith;
        const tempCtx = tempCanvas.getContext('2d', {
          willReadFrequently: true,
        }) as CanvasRenderingContext2D;
        // 计算开始XY
        const startX = configRef.getProjectSizeConfigPxOffsetX / blockWith;
        const startY = configRef.getProjectSizeConfigPxOffsetY / blockWith;
        // 分块导出
        for (let indexX = 0; indexX < blocksX; indexX++) {
          for (let indexY = 0; indexY < blocksY; indexY++) {
            const _x = indexX * blockWith;
            const _y = indexY * blockWith;
            tempCtx.putImageData(fullCtx.getImageData(_x, _y, blockWith, blockWith), 0, 0);
            await tempCanvas.toBlob(
              async (blob) => {
                const filename = exportRef.value + (startY + indexY) + '_' + (startX + indexX) + '.jpg';
                if (localApi) {
                  await blob?.arrayBuffer().then((data) => {
                    localApi.saveLocalFile(filename, data as Buffer, localState.getColorExportLocation).then((e) => {
                      if (e) {
                        message.error('色值图导出失败！');
                        console.error(e);
                        return;
                      }
                    });
                  });
                } else {
                  exportFile(filename, blob);
                }
              },
              'image/jpeg',
              1.0,
            );
          }
        }
        message.success('色值图导出完成！');
        localApi &&
          localApi.getCustomConfig().then((config) => {
            if (config.autoOpenDownloadDirectory) {
              localApi.openFolder(localState.getColorExportLocation);
            }
          });
      } catch (e) {
        message.error('色值图导出失败！');
      }
      spinningRef.value = false;
      handleCancel();
    }, 50);
  }

  function handleCancel() {
    emit('cancel');
  }
</script>

<style lang="less">
  .color-image-modal {
    .canvas-wrapper {
      display: flex;
      margin: 15px auto;
      padding: 5px;
      max-width: 1000px;
      max-height: 620px;
      overflow: auto;
    }
    .modal-content {
      padding: 36px 56px 56px;
      .title {
        font-weight: bold;
      }
    }
    .ant-space-vertical,
    .ant-checkbox-group {
      width: 100%;
    }
    canvas {
      margin: auto;
    }
    .tip {
      text-align: center;
    }
  }
</style>
