<template>
  <div class="default-option">
    <a-row class="option-group" style="height: 100px">
      <a-col class="row-label" :span="4">
        <span class="group-label">文件： </span>
      </a-col>
      <a-col :span="18">
        <a-button type="primary" @click="handleChangeMapSize">设置地图尺寸</a-button>
      </a-col>
      <a-col :span="6" :offset="4">
        <a-button disabled @click="">保存</a-button>
      </a-col>
      <a-col :span="6">
        <a-button disabled @click="">加载</a-button>
      </a-col>
      <a-col :span="6">
        <a-button type="primary" @click="getPosition">下载坐标</a-button>
      </a-col>
    </a-row>
    <a-row class="option-group" style="height: 250px">
      <a-col class="row-label" :span="4">
        <span class="group-label">图层： </span>
      </a-col>
      <a-col :span="24">
        <layer-list></layer-list>
      </a-col>
    </a-row>
    <area-options
      style="height: 100px"
      @end-edit-area="(...props) => emit('end-edit-area', ...props)"
    />
    <edit-options></edit-options>
    <a-row class="option-group" style="height: 200px">
      <a-col class="row-label" :span="4">设置：</a-col>
      <a-col :span="12">
        <div class="auto-connect">
          <span>自动连接: </span>
          <a-switch
            :default-checked="configRef.autoConnect"
            @change="(value: any) => configRef.setAutoConnect(value)"
          />
        </div>
      </a-col>
      <a-col class="pickr-wrapper" :span="8" :offset="4">
        <span>线条颜色： </span>
        <span id="pickr"> </span>
      </a-col>
      <a-col class="pickr-wrapper" :span="12">
        <span>线条宽度： </span>
        <a-input-number
          mode="button"
          size="small"
          :max="10"
          :min="1"
          :step="1"
          :precision="1"
          :default-value="configRef.lineWidth"
          :formatter="(value: number) => Number(value).toFixed(0)"
          @change="(num: number) => configRef.setLineWidth(num)"
        />
      </a-col>
      <!-- <a-col :span="20" :offset="4">
        比例：
        <controlled-slider @register="registerControllerSlider"></controlled-slider>
      </a-col> -->
    </a-row>
  </div>
  <change-map-size-modal
    :visible="changeMapSizeModalVisible"
    @close="changeMapSizeModalVisible = false"
  ></change-map-size-modal>
</template>

<script setup lang="ts">
  import { Ref, inject, onMounted, ref, unref } from 'vue';
  import modal from '@arco-design/web-vue/es/modal';
  import message from '@arco-design/web-vue/es/message';
  import ControlledSlider, { useControllerSlider } from '../../components/controlled-slider';
  import LayerList from './components/layer-list.vue';
  import AreaOptions from './components/area-options.vue';
  import EditOptions from './components/edit-options.vue';
  import ChangeMapSizeModal from './components/change-map-size-modal.vue';
  import { Layer } from './common/types';
  import { useColorPicker } from '../../hooks/useColorPicker';
  import { useLoading } from '../../components/Loading';
  import { exportFile } from '../../utils/file';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { dataToBin } from './common/quadtree-utils';
  import { getClosedCurvePointsData } from './common/image-data-util';
  import { isNullOrUnDef } from '@/utils/is';

  const emit = defineEmits<{
    (e: 'end-edit-area', name: string, complete: boolean): void;
  }>();

  const configRef = useEditorConfig();
  const layersRef: Ref<Layer[]> = inject('layers', [] as any);

  const [openLoading, closeLoading] = useLoading({ tip: '计算中！', minTime: 1500 });
  function getPosition() {
    modal.confirm({
      title: '确认',
      content: '下载当前显示图层的坐标数据',
      onOk: () => {
        const layers = unref(layersRef);
        new Promise((resolve) => {
          openLoading();
          setTimeout(() => {
            for (let index = layers.length - 1; index >= 0; index--) {
              const layer = layers[index];
              if (layer.visible && layer.hot) {
                if (isNullOrUnDef(layer.ctxs) || layer.ctxs?.length === 0) {
                  message.warning('获取图层数据失败！');
                  break;
                }
                layer.areas.forEach((area) => {
                  const data = getClosedCurvePointsData(area);
                  exportFile(area.getName() + '.data.bin', dataToBin(data, ...area.getBoundRect()));
                });
              }
            }
            resolve(true);
          }, 10);
        }).finally(() => closeLoading());
      },
    });
  }

  const changeMapSizeModalVisible = ref(false);
  function handleChangeMapSize() {
    changeMapSizeModalVisible.value = true;
  }

  const [registerControllerSlider] = useControllerSlider({
    onChange: function (val) {
      configRef.setZoom(val);
    },
  });

  const pickrInstance = useColorPicker('#pickr');
  onMounted(() => {
    pickrInstance.init();
    pickrInstance.on('save', (color) => {
      configRef.setColor(color.toRGBA().toString());
    });
  });
</script>

<style lang="less">
  .default-option {
    color: #d4d4d4;
    .arco-upload-wrapper {
      width: auto;
    }
    .arco-select {
      width: 90px;
      height: 38px;
    }
    .arco-row {
      align-items: center;
      margin: 10px;
      .arco-col {
        margin-bottom: 6px;
        font-size: 12px;
      }
      .row-label {
        font-weight: bold;
        font-size: 14px;
      }
      .arco-btn-group {
        .pcr-button {
          height: 32px;
          width: 32px;
          margin-left: 1px;
        }
      }
      .arco-input-number {
        width: 100px;
      }
    }
    .pickr-wrapper {
      display: flex;
      align-items: center;
    }
    .arco-btn.actived {
      color: var(--color-text-2);
      background-color: var(--color-secondary-active);
      border-color: transparent;
    }
    .option-group {
      border-bottom: 1px solid var(--color-border-2);
    }
    .arco-btn {
      font-size: 12px;
      width: 80px;
      height: 32px;
    }
    .arco-input-wrapper {
      background-color: transparent;
      border-color: var(--color-fill-3);
    }
  }
  .result {
    margin-top: 400px;
    margin-left: 200px;
  }
</style>
