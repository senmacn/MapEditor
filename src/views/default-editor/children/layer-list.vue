<template>
  <div class="layer-list">
    <div class="layer-item title">
      <div class="layer-index">序号</div>
      <div class="layer-name"> 名称 </div>
      <div class="layer-option"> 操作 </div>
    </div>
    <transition-group name="list" tag="ul">
      <li
        class="layer-item"
        v-for="(layer, index) in (canvasState.layers as Layer[])"
        :key="layer.uuid"
      >
        <div class="layer-content">
          <div
            class="layer-index"
            draggable
            @dragenter="dragenter($event, index)"
            @dragover.prevent
            @dragstart="dragstart(index)"
          >
            <fire-outlined v-if="layer.hot" />
            {{ index + 1 }}
          </div>
          <div class="layer-name">
            <a-input type="text" v-model:value="layer.name" />
          </div>
          <div class="layer-option">
            <a-space>
              <a-tooltip title="隐藏图层" v-if="layer.visible">
                <a-button
                  type="text"
                  class="success-color"
                  @click="() => changeLayerVisible(layer, false)"
                >
                  <template #icon><eye-outlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="显示图层" v-else>
                <a-button type="text" @click="() => changeLayerVisible(layer, true)">
                  <template #icon><eye-invisible-outlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="上传底图">
                <a-button
                  type="text"
                  :class="layer.map ? 'success-color' : 'none'"
                  @click="handleUploadBackground(index)"
                >
                  <template #icon>
                    <file-image-outlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-button type="text" @click="() => handleLayerDelete(index)">
                <template #icon>
                  <delete-outlined />
                </template>
              </a-button>
            </a-space>
          </div>
        </div>
        <area-list :areas="layer.areas" :pins="layer.pins" />
      </li>
    </transition-group>
    <a-tooltip title="添加图层">
      <a-button @click="handleLayerAdd">
        <plus-circle-outlined />
      </a-button>
    </a-tooltip>
    <upload-background-modal
      :visible="backgroundModalVisibleRef"
      @ok="handleUploadBackgroundFile"
      @cancel="backgroundModalVisibleRef = false"
    ></upload-background-modal>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import AreaList from './area-list.vue';
  import modal from 'ant-design-vue/lib/modal';
  import { getRandomDomId } from '../../../utils/uuid';
  import { Layer } from '../common/types';
  import {
    FileImageOutlined,
    FireOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    DeleteOutlined,
    PlusCircleOutlined,
  } from '@ant-design/icons-vue';
  import UploadBackgroundModal from './upload-background-modal.vue';
  import { useCanvasState } from '@/store/modules/canvas-state';

  const canvasState = useCanvasState();

  // 当前聚焦
  const refreshHot = () => {
    let isHot = false;
    for (let index = canvasState.layers.length - 1; index >= 0; index--) {
      const element = canvasState.layers[index];
      element.hot = false;
      if (element.visible && !isHot) {
        element.hot = true;
        isHot = true;
      }
    }
  };
  function changeLayerVisible(layer: Layer, visible: boolean) {
    layer.visible = visible;
    refreshHot();
  }
  function handleLayerAdd() {
    canvasState.layers.push({
      uuid: getRandomDomId(),
      name: '图层' + (canvasState.layers.length + 1),
      hot: true,
      visible: true,
      map: null,
      areas: [],
      pins: [],
      transparency: 1,
    });
    refreshHot();
  }
  function handleLayerDelete(index: number) {
    modal.confirm({
      title: '确认',
      content: `删除[${canvasState.layers[index].name}]的操作不可逆，请仔细确认！`,
      onOk: () => {
        canvasState.layers.splice(index, 1);
        refreshHot();
      },
    });
  }

  const backgroundModalVisibleRef = ref(false);
  let updateIndex = 0;
  function handleUploadBackground(index: number) {
    updateIndex = index;
    backgroundModalVisibleRef.value = true;
  }
  function handleUploadBackgroundFile(base64: string, trans: number) {
    backgroundModalVisibleRef.value = false;
    canvasState.layers[updateIndex].map = base64;
    canvasState.layers[updateIndex].transparency = trans;
    canvasState.layers[updateIndex].visible = true;
  }

  const dragIndexRef = ref(0);
  function dragstart(index: number) {
    dragIndexRef.value = index;
  }
  function dragenter(e: MouseEvent, index: number) {
    e.preventDefault();
    // 禁止修改背景图层
    if (index === 0) return;
    // 避免源对象触发自身的dragenter事件
    if (dragIndexRef.value !== index) {
      const source = canvasState.layers[dragIndexRef.value];
      canvasState.layers.splice(dragIndexRef.value, 1);
      canvasState.layers.splice(index, 0, source);
      // 排序变化后目标对象的索引变成源对象的索引
      dragIndexRef.value = index;
      refreshHot();
    }
  }
</script>

<style lang="less">
  .layer-list {
    border: 1px solid @color-border-table;
    width: 100%;
    > ul {
      min-height: 160px;
      max-height: 160px;
      padding: 0;
      margin: 0;
      overflow-y: auto;
    }
    ul::-webkit-scrollbar {
      display: none;
    }
    > .ant-btn {
      width: 100% !important;
      height: 24px !important;
    }
  }
  .anticon {
    font-size: 14px;
  }
  .anticon-fire {
    color: rgb(255, 50, 48) !important;
  }

  .layer-item {
    list-style: none;
    border-bottom: 1px solid @color-border-table;
    &.title {
      display: flex;
      font-weight: bold;
      background: @color-border-table;
      text-align: center;
    }
    .layer-content {
      display: flex;
      justify-content: center;
    }
    .layer-index,
    .layer-name,
    .layer-option {
      height: 24px;
      border-right: 1px solid @color-border-table;
      border-bottom: 1px solid @color-border-table;
      text-align: center;
      line-height: 24px;
      font-size: 12px;
    }
    .layer-index {
      cursor: grab;
      width: 60px;
    }
    .layer-name {
      flex: 1;
      input.ant-input {
        font-size: 12px;
        line-height: 24px;
        text-align: center;
        height: 100%;
        border: 0;
      }
      span {
        font-size: 12px;
        line-height: 24px;
      }
    }
    .layer-option {
      width: 140px;
      border-right: 0;
      .ant-btn {
        display: inline-block;
        height: 18px;
        width: 18px;
      }
    }
  }
</style>
