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
            <a-tooltip title="这一参数决定了最终导出图片的个数 (必须是X * X)">
              <a-col :span="4">
                色值图导出数量
                <info-circle-outlined class="warning-color" />
              </a-col>
            </a-tooltip>
            <a-col :span="8">
              <a-input-number v-model:value="exportRef" :max="128" :min="1" :step="1" />
            </a-col>
          </a-row>
          <a-row>
            <a-tooltip title="区域的最大数量，决定了下面区域色值的最大值">
              <a-col :span="4">
                区域总数量
                <info-circle-outlined class="warning-color" />
              </a-col>
            </a-tooltip>
            <a-col :span="8">
              <a-input-number v-model:value="totalAreasRef" :max="200" :min="0" :step="1" />
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
            <a-col :span="8" v-for="area in layer.areas">
              <a-checkbox :value="area.getUuid()">
                <gateway-outlined />
                {{ area.getName() }}
              </a-checkbox>
              <a-input-number v-model:value="areasColorValueRef[area.getUuid()]">
                {{ area.getName() }}
              </a-input-number>
            </a-col>
          </a-row>
        </a-checkbox-group>
      </div>
      <div class="confirm-button-group">
        <a-button type="primary" @click="handleExportColorImage" :disabled="areasRef.length === 0">
          导出
        </a-button>
        <a-button @click="handleCancel">取消</a-button>
      </div>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { GatewayOutlined, BlockOutlined } from '@ant-design/icons-vue';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import { Area } from '../draw-element';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { getClosedCurvePointsData } from '../utils/image-data-util';
  import { exportFile } from '@/utils/file';
  import { message } from 'ant-design-vue';
  import { InfoCircleOutlined } from '@ant-design/icons-vue';

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

  const exportRef = ref(4);
  const totalAreasRef = ref(100);
  const areasRef = ref<string[]>([]);
  const areasColorValueRef = ref<Recordable<number>>({});
  const spinningRef = ref(false);

  function handleExportColorImage() {
    spinningRef.value = true;
    setTimeout(() => {
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
        fullCanvas.width = configRef.size.x;
        fullCanvas.height = configRef.size.y;
        const fullCtx = fullCanvas.getContext('2d', {
          willReadFrequently: true,
        }) as CanvasRenderingContext2D;
        for (const area of areas) {
          // 计算色值
          const color = Math.floor(
            (255 / totalAreasRef.value) * areasColorValueRef.value[area.getUuid()],
          );
          const data = getClosedCurvePointsData(area, [color, 0, 0, 255]);
          fullCtx.putImageData(data, area.getActualBoundRect()[0], area.getActualBoundRect()[1]);
        }
        // 分块导出准备
        const blocks = Math.sqrt(exportRef.value);
        const blockWith = configRef.size.x / blocks;
        const blockHeight = configRef.size.x / blocks;
        // 创建临时canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = blockWith;
        tempCanvas.height = blockHeight;
        const tempCtx = tempCanvas.getContext('2d', {
          willReadFrequently: true,
        }) as CanvasRenderingContext2D;
        // 分块导出
        for (let indexX = 0; indexX < blocks; indexX++) {
          for (let indexY = 0; indexY < blocks; indexY++) {
            const _x = indexX * blockWith;
            const _y = indexY * blockHeight;
            tempCtx.putImageData(fullCtx.getImageData(_x, _y, blockWith, blockHeight), 0, 0);
            tempCanvas.toBlob(
              (blob) => {
                exportFile(indexX + '_' + indexY + '.jpg', blob);
              },
              'image/jpeg',
              1.0,
            );
          }
        }
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
