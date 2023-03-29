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
        <a-button type="primary" @click="getPosition">获取坐标</a-button>
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
          :class="[controller.getState() === CanvasOption.ClickOnce && 'actived']"
          @click="() => handleChangeOptionState(CanvasOption.ClickOnce)"
        >
          单击选中
        </a-button>
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
      <!-- <a-col :span="6" :offset="4">
        <a-button
          :class="[controller.getState() === CanvasOption.DrawRect && 'actived']"
          @click="() => handleChangeOptionState(CanvasOption.DrawRect)"
>选择矩形</a-button>
      </a-col> -->
    </a-row>
    <div>
      <canvas id="displayCanvas" width="250" height="250"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import ATextArea from '@arco-design/web-vue/es/textarea';
  import { Row as ARow, Col as ACol } from '@arco-design/web-vue/es/grid';
  import ASelect, { Option as AOption } from '@arco-design/web-vue/es/select';
  import ControlledSlider, { useControllerSlider } from '../../components/controlled-slider';
  import { useCanvasConfigContext } from './context/useCanvasConfig';
  import controller, { CanvasOption } from './common/canvas-options';
  import { emitCanvasRevertEvent } from './common/event';

  const emit = defineEmits<{
    (e: 'update-style', key: string, value: string): void;
    (e: 'update-mapFile', file: File): void;
    (e: 'update-zoom', zoom: number): void;
  }>();

  const props = defineProps({
    filledMap: {
      type: Map<String, Boolean>,
      default: new Map(),
    },
  });

  const positionsRef = ref('');
  const configRef = useCanvasConfigContext();

  // 获取扩展
  function getInterpolationList(position: any[]) {
    const val = [position];
    for (let index = 1; index < configRef.gridSize / configRef.zoom; index++) {
      val.push([position[0], position[1] + index]);
      val.push([position[0] + index, position[1]]);
    }
    return val;
  }

  function getPosition() {
    const positions: string[] = [];
    for (const key of props.filledMap.keys()) {
      if (props.filledMap.get(key)) {
        const keyList = key.split(',');
        const newKeyList = getInterpolationList(
          keyList.map((item: any) => (item / configRef.zoom) * configRef.gridSize),
        );
        newKeyList.forEach((list) => {
          positions.push(`[${list.join(',')}]`);
        });
      }
    }
    positionsRef.value = positions.join(', ');
  }

  function handleUploadFile(file: File) {
    emit('update-mapFile', file);
    return Promise.reject();
  }

  function handleChangeOptionState(state: CanvasOption) {
    controller.setState(state);
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

  const [registerControllerSlider, { getValue }] = useControllerSlider({
    onChange: function (val) {
      emit('update-zoom', val);
    },
  });

  const gridDensityRef = ref('正常');
  watch(
    () => gridDensityRef.value,
    () => {
      switch (gridDensityRef.value) {
        case '密集':
          emit('update-style', 'justify-content', 'left');
          break;
        case '正常':
          emit('update-style', 'justify-content', 'right');
          break;
        case '松散':
        default:
          emit('update-style', 'justify-content', 'center');
          break;
      }
    },
  );
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

  .group-label {
  }

  .result {
    margin-top: 400px;
    margin-left: 200px;
  }

  .displayCanvas {
    background: url('src\\assets\\images\\test.png');
    background-repeat: no-repeat;
  }
</style>
