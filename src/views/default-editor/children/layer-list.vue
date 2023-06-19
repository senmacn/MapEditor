<template>
  <div class="layer-list">
    <div class="layer-item title">
      <div class="layer-index">显示</div>
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
            :draggable="true"
            @dragenter.stop="dragenter($event, index)"
            @dragstart.stop="dragstart($event, index)"
            @dragend.prevent="dragend()"
          >
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
          </div>
          <div class="layer-name">
            <a-input type="text" v-model:value="layer.name" />
          </div>
          <div class="layer-option">
            <a-space>
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
    EyeOutlined,
    EyeInvisibleOutlined,
    DeleteOutlined,
    PlusCircleOutlined,
  } from '@ant-design/icons-vue';
  import UploadBackgroundModal from './upload-background-modal.vue';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import { useLoading } from '@/components/Loading';
  import { message } from 'ant-design-vue';

  const canvasState = useCanvasState();

  function changeLayerVisible(layer: Layer, visible: boolean) {
    layer.visible = visible;
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
  }
  function handleLayerDelete(index: number) {
    modal.confirm({
      title: '确认',
      content: `删除[${canvasState.layers[index].name}]的操作不可逆，请仔细确认！`,
      onOk: () => {
        canvasState.layers.splice(index, 1);
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
    if (base64.length) {
      canvasState.layers[updateIndex].map = base64;
    }
    canvasState.layers[updateIndex].transparency = trans;
    canvasState.layers[updateIndex].visible = true;
  }

  const dragIndexRef = ref(-1);
  function dragstart(_, index: number) {
    console.log('dragstart', index);
    dragIndexRef.value = index;
  }
  function dragenter(_, index: number) {
    console.log(dragIndexRef.value, index);
    // 避免源对象触发自身的dragenter事件
    if (dragIndexRef.value !== index) {
      const source = canvasState.layers[dragIndexRef.value];
      canvasState.layers.splice(dragIndexRef.value, 1);
      canvasState.layers.splice(index, 0, source);
      // 排序变化后目标对象的索引变成源对象的索引
      dragIndexRef.value = index;
    }
  }
  const [openLoading, closeLoading] = useLoading({ tip: '移动中', minTime: 1000 });
  function dragend() {
    openLoading();
    setTimeout(() => {
      message.success('移动完成！');
      closeLoading();
    }, 1000);
  }
</script>

<style lang="less">
  .layer-list {
    border: 1px solid @color-border-table;
    width: 100%;
    > ul {
      min-height: 280px;
      max-height: 280px;
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
    &.active {
      background: rgb(64, 64, 64);
    }
    &.title {
      display: flex;
      font-weight: bold;
      background: @color-border-table;
      text-align: center;
      .layer-index {
        border-left: 0;
      }
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
      .ant-btn {
        display: inline-block;
        height: 18px;
        width: 18px;
      }
    }
    .layer-index {
      width: 60px;
      border-left: 3px double rgb(100, 100, 100);
      cursor: grab;
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
    }
  }
</style>
