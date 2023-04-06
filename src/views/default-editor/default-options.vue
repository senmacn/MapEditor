<template>
  <div class="default-option">
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
      <a-col :span="6">
        <a-button type="primary" @click="getPosition">下载坐标</a-button>
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
        <span class="group-label">区域： </span>
      </a-col>
      <a-col :span="12">
        <a-button-group>
          <a-input type="text" placeholder="区域标识" v-model="areaNameRef"></a-input>
          <a-button
            type="primary"
            v-if="!controller.isDrawingArea()"
            @click="handleStartDrawingArea"
          >
            新增区域
          </a-button>
          <a-button type="primary" v-else @click="handleEndDrawingArea(true)"> 完成区域 </a-button>
        </a-button-group>
      </a-col>
      <a-col :span="6" v-if="controller.isDrawingArea()">
        <a-button @click="handleEndDrawingArea(false)">取消</a-button>
      </a-col>
      <a-col :offset="4" :span="6">
        <a-button
          @click=""
          v-if="!controller.isDrawingArea()"
          :disabled="!controller.getCurrentArea()"
        >
          <icon-edit />
          编辑
        </a-button>
        <a-button @click="" v-else disabled>
          <icon-edit />
          完成
        </a-button>
      </a-col>
      <a-col :span="6">
        <a-button status="danger" @click="" disabled>
          <icon-delete />
          删除
        </a-button>
      </a-col>
    </a-row>
    <a-row class="option-group edit-options">
      <a-col class="row-label" :span="4">
        <span class="group-label">工具： </span>
      </a-col>
      <a-col :span="3">
        <a-tooltip content="画笔">
          <a-button
            :class="[controller.getState() === CanvasOption.FollowMouse && 'actived']"
            @click="() => handleChangeOptionState(CanvasOption.FollowMouse)"
            :disabled="!controller.isDrawingArea()"
          >
            <icon-edit />
          </a-button>
        </a-tooltip>
      </a-col>
      <a-col :span="3">
        <a-tooltip content="橡皮">
          <a-button
            :class="[controller.getState() === CanvasOption.FollowMouseClear && 'actived']"
            @click="() => handleChangeOptionState(CanvasOption.FollowMouseClear)"
            :disabled="!controller.isDrawingArea()"
          >
            <icon-eraser />
          </a-button>
        </a-tooltip>
      </a-col>
      <a-col :span="3">
        <a-tooltip content="撤销">
          <a-button @click="emitCanvasUndoEvent" :disabled="!controller.isDrawingArea()">
            <icon-undo />
          </a-button>
        </a-tooltip>
      </a-col>
      <a-col :span="3">
        <a-tooltip content="还原">
          <a-button @click="emitCanvasRedoEvent" :disabled="!controller.isDrawingArea()">
            <icon-redo />
          </a-button>
        </a-tooltip>
      </a-col>
    </a-row>
    <a-row class="option-group edit-options">
      <a-col class="row-label" :span="4">
        <span class="group-label">形状： </span>
      </a-col>
      <a-col :span="3">
        <a-tooltip content="直线">
          <a-button
            :class="[controller.getState() === CanvasOption.DrawLine && 'actived']"
            @click="() => handleChangeOptionState(CanvasOption.DrawLine)"
            :disabled="!controller.isDrawingArea()"
          >
            <img :src="LinePNG" class="arco-icon" />
          </a-button>
        </a-tooltip>
      </a-col>
      <a-col :span="3">
        <a-tooltip content="圆">
          <a-button
            :class="[controller.getState() === CanvasOption.DrawCircle && 'actived']"
            @click="() => handleChangeOptionState(CanvasOption.DrawCircle)"
            :disabled="!controller.isDrawingArea()"
          >
            <img :src="CirclePNG" class="arco-icon" />
          </a-button>
        </a-tooltip>
      </a-col>
      <a-col :span="3">
        <a-tooltip content="矩形">
          <a-button
            :class="[controller.getState() === CanvasOption.DrawRect && 'actived']"
            @click="() => handleChangeOptionState(CanvasOption.DrawRect)"
            :disabled="!controller.isDrawingArea()"
          >
            <img :src="RectPNG" class="arco-icon" />
          </a-button>
        </a-tooltip>
      </a-col>
    </a-row>
    <a-row class="option-group">
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
  import controller, { CanvasOption } from './common/canvas-state-controller';
  import { emitCanvasUndoEvent, emitCanvasRedoEvent } from './common/event';
  import LayerList from './components/layer-list.vue';
  import * as imageDataUtil from './common/image-data-util';
  import { Layer } from './common/types';
  import { useColorPicker } from '../../hooks/useColorPicker';
  import { useLoading } from '../../components/Loading';
  import { exportFile } from '../../utils/file';
  import CirclePNG from '@/assets/icons/circle.png';
  import RectPNG from '@/assets/icons/rect.png';
  import LinePNG from '@/assets/icons/line.png';
  import { useEditorConfig } from '@/store/modules/editor-config';

  const emit = defineEmits<{
    (e: 'end-edit-area', name: string, complete: boolean): void;
  }>();

  let allPositionData = '';
  const configRef = useEditorConfig();
  const layersRef: Ref<Layer[]> = inject('layers', [] as any);

  const [openLoading, closeLoading] = useLoading({ tip: '计算中！', minTime: 1000 });
  function getPosition() {
    modal.confirm({
      title: '确认',
      content: '下载当前显示图层的坐标数据！',
      onOk: () => {
        const layers = unref(layersRef);
        new Promise((resolve) => {
          openLoading();
          setTimeout(() => {
            for (let index = layers.length - 1; index >= 0; index--) {
              const layer = layers[index];
              if (layer.visible && layer.hot) {
                if (layer.ctx == null) {
                  message.warning('获取图层数据失败！');
                  break;
                }
                allPositionData = imageDataUtil.getPosition(layer.ctx.getImageData()).join(' ');
              }
            }
            resolve(true);
          }, 10);
        }).finally(() => closeLoading());
        exportFile('data.json', allPositionData);
        allPositionData = '';
      },
    });
  }

  const areaNameRef = ref('');
  function handleStartDrawingArea() {
    if (!areaNameRef.value.length) {
      message.warning('请填写区域标识！');
      return;
    }
    controller.startDrawingArea();
  }
  function handleEndDrawingArea(complete: boolean) {
    if (complete && !areaNameRef.value.length) {
      message.warning('请填写区域标识！');
      return;
    }
    emit('end-edit-area', areaNameRef.value, complete);
    areaNameRef.value = '';
  }

  function handleChangeOptionState(state: CanvasOption) {
    controller.setState(state);
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
    .arco-btn {
      font-size: 12px;
      width: 80px;
      height: 32px;
    }
    .arco-btn-disabled {
      img {
        filter: opacity(0.2);
      }
    }
    .arco-btn.actived {
      color: var(--color-text-2);
      background-color: var(--color-secondary-active);
      border-color: transparent;
    }
    .option-group {
      border-bottom: 1px solid var(--color-border-2);
    }
    .edit-options button {
      font-size: 12px;
      width: 40px;
      height: 32px;
      padding: 0 4px;
    }
  }
  .arco-input-wrapper {
    border-color: var(--color-fill-3);
  }
  .result {
    margin-top: 400px;
    margin-left: 200px;
  }
  .auto-connect {
  }
</style>
