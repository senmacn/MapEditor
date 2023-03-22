<template>
  <div class="map-option">
    <div class="position">
      <a-text-area v-model="positionsRef"></a-text-area>
    </div>
    <a-row>
      <a-col :span="4">
        <span class="group-label">文件： </span>
      </a-col>
      <a-col :span="6">
        <a-upload @beforeUpload="handleUploadFile" accept=".png,.jpg">
          <template #upload-button>
            <a-button type="primary">
              <template #icon>
                <icon-upload />
              </template>
              上传
            </a-button>
          </template>
        </a-upload>
      </a-col>
      <a-col :span="6">
        <!-- <a-button type="primary" @click="getPosition">获取坐标</a-button> -->
      </a-col>
    </a-row>
    <a-row>
      <a-col :span="4">
        <span class="group-label">查看： </span>
      </a-col>
      <a-col :span="6">
        <a-tooltip content="图片位置">
          <a-select v-model="styleStateRef">
            <a-option>居中</a-option>
            <a-option>居左</a-option>
            <a-option>居右</a-option>
          </a-select>
        </a-tooltip>
      </a-col>
      <!-- <a-tooltip content="网格密度">
        <a-select v-model="gridDensityRef">
          <a-option>密集</a-option>
          <a-option>正常</a-option>
          <a-option>松散</a-option>
        </a-select>
      </a-tooltip> -->
    </a-row>
    <a-row>
      <a-col :span="22" :offset="2">
        <controlled-slider @register="registerControllerSlider"></controlled-slider>
      </a-col>
    </a-row>
    <a-row>
      <a-col :span="4">
        <span class="group-label">功能： </span>
      </a-col>
      <a-col :span="6">
        <a-button
          :class="[controller.getState() === CanvasOption.FollowMouse && 'actived']"
          @click="() => handleChangeOptionState(CanvasOption.FollowMouse)"
        >
          跟随鼠标
        </a-button>
      </a-col>
      <a-col :span="6">
        <a-button
          :class="[controller.getState() === CanvasOption.DrawLine && 'actived']"
          @click="() => handleChangeOptionState(CanvasOption.DrawLine)"
        >
          选择直线
        </a-button>
      </a-col>
      <a-col :span="6" :offset="4">
        <a-button
          :class="[controller.getState() === CanvasOption.FollowMouseClear && 'actived']"
          @click="() => handleChangeOptionState(CanvasOption.FollowMouseClear)"
        >
          擦除
        </a-button>
      </a-col>
      <a-col :span="6">
        <a-button @click="emitCanvasRevertEvent"> 撤销 </a-button>
      </a-col>
      <a-col :span="12" :offset="4">
        <div class="auto-connect">
          <span>自动连接: </span>
          <a-switch
            :default-checked="configRef.autoConnect"
            @change="handleAutoConnectChange"
          ></a-switch>
        </div>
      </a-col>
    </a-row>
    <div>
      <canvas id="displayCanvas" width="250" height="250"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import AButton from '@arco-design/web-vue/es/button';
  import ASwitch from '@arco-design/web-vue/es/switch';
  import AUpload from '@arco-design/web-vue/es/upload';
  import ATextArea from '@arco-design/web-vue/es/textarea';
  import ATooltip from '@arco-design/web-vue/es/tooltip';
  import { Row as ARow, Col as ACol } from '@arco-design/web-vue/es/grid';
  import ASelect, { Option as AOption } from '@arco-design/web-vue/es/select';
  import ControlledSlider, { useControllerSlider } from '../../components/controlled-slider';
  import controller, { CanvasOption } from './common/canvas-options';
  import { emitCanvasRevertEvent } from './common/event';
  import { useCanvasConfigContext } from './hooks/useCanvasConfig';

  const emit = defineEmits<{
    (e: 'update-style', key: string, value: string): void;
    (e: 'update-mapFile', file: File): void;
    (e: 'update-config', key: string, value: any): void;
    (e: 'change-visible', visible: boolean): void;
  }>();

  const positionsRef = ref('');
  const configRef = useCanvasConfigContext();

  // function getPosition() {
  //   const positions: string[] = [];
  //   for (const key of props.filledMap.keys()) {
  //     if (props.filledMap.get(key)) {
  //       const keyList = key.split(',');
  //       const newKeyList = getInterpolationList(
  //         keyList.map((item: any) => (item / configRef.zoom) * configRef.gridSize),
  //       );
  //       newKeyList.forEach((list) => {
  //         positions.push(`[${list.join(',')}]`);
  //       });
  //     }
  //   }
  //   positionsRef.value = positions.join(', ');
  // }

  function handleUploadFile(file: File) {
    emit('update-mapFile', file);
    return Promise.reject();
  }

  function handleChangeOptionState(state: CanvasOption) {
    controller.setState(state);
    if (state === CanvasOption.DrawLine) {
      emit('change-visible', true);
    } else {
      emit('change-visible', false);
    }
  }

  function handleAutoConnectChange(value: any) {
    emit('update-config', 'autoConnect', value);
  }

  const styleStateRef = ref('居中');
  watch(
    () => styleStateRef.value,
    () => {
      switch (styleStateRef.value) {
        case '居左':
          emit('update-style', 'text-align', 'left');
          break;
        case '居右':
          emit('update-style', 'text-align', 'right');
          break;
        case '居中':
        default:
          emit('update-style', 'text-align', 'center');
          break;
      }
    },
  );

  const [registerControllerSlider] = useControllerSlider({
    onChange: function (val) {
      emit('update-config', 'zoom', val);
    },
  });
</script>

<style lang="less">
  .map-option {
    width: 400px;
    margin: 10px;
    padding: 10px;
    border: 1px solid #cccccc;
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
        margin-bottom: 10px;
      }
    }

    .arco-btn.actived {
      color: var(--color-text-2);
      background-color: var(--color-secondary-active);
      border-color: transparent;
    }
  }
  .arco-textarea-wrapper {
    height: 300px;
  }
  .result {
    margin-top: 400px;
    margin-left: 200px;
  }
  .displayCanvas {
    background: url('src\\assets\\images\\test.png');
    background-repeat: no-repeat;
  }
  .auto-connect {
  }
</style>
