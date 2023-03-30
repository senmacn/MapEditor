<template>
  <div class="default-option">
    <div class="position">
      <a-textarea v-model="positionsRef"></a-textarea>
    </div>
    <a-row class="option-group">
      <a-col class="row-label" :span="4">
        <span class="group-label">文件： </span>
      </a-col>
      <a-col :span="6">
        <a-button type="primary" disabled @click="">保存</a-button>
      </a-col>
      <a-col :span="6">
        <a-button type="primary" disabled @click="">加载</a-button>
      </a-col>
    </a-row>
    <a-row>
      <a-col :span="6" :offset="4">
        <a-button type="primary" @click="getPosition">获取坐标</a-button>
      </a-col>
      <a-col :span="8">
        <a-button-group>
          <a-button type="primary" @click="getBackgroundPosition">检测背景</a-button>
          <span id="backgroundPickr"> </span>
        </a-button-group>
      </a-col>
      <a-col :span="6">
        <a-button type="primary" @click="exportData">下载完整数据</a-button>
      </a-col>
    </a-row>
    <a-row class="option-group">
      <a-col class="row-label" :span="4">
        <span class="group-label">图层： </span>
      </a-col>
      <a-col :span="24">
        <layer-list></layer-list>
      </a-col>
    </a-row>
    <a-row class="option-group">
      <a-col class="row-label" :span="4">
        <span class="group-label">功能： </span>
      </a-col>
      <a-col :span="6">
        <a-button
          :class="[controller.getState() === CanvasOption.FollowMouse && 'actived']"
          @click="() => handleChangeOptionState(CanvasOption.FollowMouse)"
        >
          <icon-edit />
          画笔
        </a-button>
      </a-col>
      <a-col :span="6">
        <a-button
          :class="[controller.getState() === CanvasOption.DrawLine && 'actived']"
          @click="() => handleChangeOptionState(CanvasOption.DrawLine)"
        >
          <icon-oblique-line />
          直线
        </a-button>
      </a-col>
      <a-col :span="6">
        <a-button
          :class="[controller.getState() === CanvasOption.FollowMouseClear && 'actived']"
          @click="() => handleChangeOptionState(CanvasOption.FollowMouseClear)"
        >
          <icon-eraser />
          橡皮
        </a-button>
      </a-col>
    </a-row>
    <a-row>
      <a-col :span="6" :offset="4">
        <a-button @click="emitCanvasUndoEvent">
          <icon-undo />
          撤销
        </a-button>
      </a-col>
      <a-col :span="6">
        <a-button @click="emitCanvasRedoEvent">
          <icon-redo />
          还原
        </a-button>
      </a-col>
    </a-row>
    <a-row class="option-group">
      <a-col class="row-label" :span="4">设置：</a-col>
      <a-col :span="12">
        <div class="auto-connect">
          <span>自动连接: </span>
          <a-switch
            :default-checked="configRef.autoConnect"
            @change="(value: any) => emit('update-config', 'autoConnect', value)"
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
          @change="(num: number) => emit('update-config', 'lineWidth', num)"
        />
      </a-col>
    </a-row>
    <a-row>
      <a-col :span="20" :offset="4">
        比例：
        <controlled-slider @register="registerControllerSlider"></controlled-slider>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
  import { Ref, inject, onMounted, ref, unref } from 'vue';
  import modal from '@arco-design/web-vue/es/modal';
  import message from '@arco-design/web-vue/es/message';
  import ControlledSlider, { useControllerSlider } from '../../components/controlled-slider';
  import controller, { CanvasOption } from './common/canvas-controller';
  import { emitCanvasUndoEvent, emitCanvasRedoEvent } from './common/event';
  import { useCanvasConfigContext } from './hooks/useCanvasConfig';
  import LayerList from './components/layer-list.vue';
  import * as canvasUtil from './common/canvas-util';
  import { Layer } from './common/types';
  import { useColorPicker } from '../../hooks/useColorPicker';
  import { useLoading } from '../../components/Loading';
  import { exportFile } from '../../utils/file';

  const emit = defineEmits<{
    (e: 'update-style', key: string, value: string): void;
    (e: 'update-config', key: string, value: any): void;
  }>();

  const positionsRef = ref<any>('');
  const configRef = useCanvasConfigContext();
  const layersRef: Ref<Layer[]> = inject('layers', [] as any);

  const [openLoading, closeLoading] = useLoading({ tip: '计算中！', minTime: 1000 });
  function getPosition() {
    const layers = unref(layersRef);
    new Promise((resolve, reject) => {
      openLoading();
      setTimeout(() => {
        for (let index = layers.length - 1; index >= 0; index--) {
          const layer = layers[index];
          if (layer.visible && layer.hot) {
            if (layer.ctx == null) {
              message.warning('获取图层数据失败！');
              break;
            }
            positionsRef.value = canvasUtil.getPosition(layer.ctx.getImageData()).join(' ');
          }
        }
        resolve(true);
      }, 10);
    }).finally(() => closeLoading());
  }
  function getBackgroundPosition() {
    const layers = unref(layersRef);
    const backgroundLayer = layers[0];
    new Promise((resolve, reject) => {
      openLoading();
      setTimeout(() => {
        if (backgroundLayer.ctx == null) {
          message.warning('获取图层数据失败！');
          return;
        }
        positionsRef.value = canvasUtil
          .getPositionByRGBAColor(
            backgroundLayer.ctx.getImageData(),
            backGroundPickrInstance.getColor(),
          )
          .join(' ');
        resolve(true);
      }, 10);
    }).finally(() => closeLoading());
  }
  function exportData() {
    modal.confirm({
      title: '确认',
      content: '导出完整的坐标数据！',
      onOk: () => {
        exportFile('data.json', positionsRef.value);
      },
    });
  }

  function handleChangeOptionState(state: CanvasOption) {
    controller.setState(state);
  }

  const [registerControllerSlider] = useControllerSlider({
    onChange: function (val) {
      emit('update-config', 'zoom', val);
    },
  });

  const pickrInstance = useColorPicker('#pickr');
  const backGroundPickrInstance = useColorPicker('#backgroundPickr');
  onMounted(() => {
    pickrInstance.init();
    pickrInstance.on('save', (color) => {
      emit('update-config', 'color', color.toRGBA().toString());
    });

    backGroundPickrInstance.init();
  });
</script>

<style lang="less">
  .default-option {
    .arco-upload-wrapper {
      width: auto;
    }
    .arco-select {
      width: 90px;
      height: 38px;
    }
    .arco-btn {
      font-size: 12px;
      width: 80px;
      height: 32px;
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
  }
  .arco-textarea-wrapper {
    height: 200px;
    textarea {
      resize: none;
    }
  }
  .result {
    margin-top: 400px;
    margin-left: 200px;
  }
  .auto-connect {
  }
</style>
