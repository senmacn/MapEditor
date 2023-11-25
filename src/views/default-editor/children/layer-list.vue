<template>
  <div class="layer-list">
    <div class="layer-item title">
      <div class="layer-index">显示</div>
      <div class="layer-name"> 名称 </div>
      <div class="layer-option"> 操作 </div>
    </div>
    <transition-group name="list" tag="ul">
      <li
        :class="['layer-item', layer.hot ? 'active' : 'inactive']"
        v-for="(layer, index) in (canvasState.layers as Layer[])"
        :key="layer.uuid"
        @click="handleSelectLayer(index)"
      >
        <div class="layer-content">
          <div
            class="layer-index"
            :draggable="!layer.lock"
            @dragenter.stop="dragenter($event, index)"
            @dragstart.stop="dragstart($event, index)"
            @dragend.stop="dragend($event)"
          >
            <a-tooltip title="隐藏图层" v-if="layer.visible">
              <a-button type="text" class="success-color" @click="() => changeLayerVisible(layer, false)">
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
            <a-input type="text" v-model:value="layer.name" :disabled="layer.lock" />
          </div>
          <div class="layer-option">
            <a-space>
              <a-tooltip title="关闭锁" v-if="layer.lock">
                <a-button type="text" class="warning-color" @click.stop="() => changeLayerLock(layer, false)">
                  <template #icon><lock-outlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="开启锁" v-else>
                <a-button type="text" class="success-color" @click.stop="() => changeLayerLock(layer, true)">
                  <template #icon><unlock-outlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="上传底图">
                <a-button
                  type="text"
                  :class="layer.map ? 'success-color' : 'none'"
                  :disabled="layer.lock"
                  @click.stop="handleUploadBackground(index)"
                >
                  <template #icon>
                    <file-image-outlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-button
                :disabled="layer.lock"
                class="warning-color"
                type="text"
                @click.stop="() => handleLayerDelete(index)"
              >
                <template #icon>
                  <delete-outlined />
                </template>
              </a-button>
            </a-space>
          </div>
        </div>
        <area-list
          v-if="layer.visible"
          :areas="layer.areas"
          :pins="layer.pins"
          :pathways="layer.pathways"
          :lock="layer.lock"
        />
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
  import type { Layer } from '../common/types';
  import { ref } from 'vue';
  import AreaList from './area-list.vue';
  import modal from 'ant-design-vue/lib/modal';
  import { getRandomDomId } from '../../../utils/uuid';
  import {
    EyeOutlined,
    EyeInvisibleOutlined,
    DeleteOutlined,
    PlusCircleOutlined,
    FileImageOutlined,
    LockOutlined,
    UnlockOutlined,
  } from '@ant-design/icons-vue';
  import UploadBackgroundModal from './upload-background-modal.vue';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import { useLoading } from '@/components/Loading';
  import { message } from 'ant-design-vue';
  import controller from '../common/canvas-state-controller';

  const canvasState = useCanvasState();
  function changeLayerVisible(layer: Layer, visible: boolean) {
    layer.visible = visible;
  }

  function handleSelectLayer(index: number) {
    controller.setCurrentLayer(canvasState.getLayers[index]);
  }

  function changeLayerLock(layer: Layer, lock: boolean) {
    layer.lock = lock;
    if (lock) {
      layer.areas.forEach((area) => {
        if (area.instance) {
          area.instance.className = 'lock-moveable';
          area.cancelSelect();
        }
      });
    } else {
      layer.areas.forEach((area) => {
        if (area.instance) {
          area.instance.className = 'moveable';
        }
      });
    }
  }

  function handleLayerAdd() {
    canvasState.layers.push({
      uuid: getRandomDomId(),
      name: '图层' + (canvasState.layers.length + 1),
      lock: false,
      hot: false,
      visible: true,
      map: null,
      areas: [],
      pathways: [],
      pins: [],
      transparency: 1,
    });
    controller.setCurrentLayer(canvasState.getLayers[canvasState.getLayers.length - 1]);
  }
  function handleLayerDelete(index: number) {
    modal.confirm({
      title: '确认',
      okText: '确定',
      cancelText: '取消',
      content: `删除[${canvasState.layers[index].name}]的操作不可逆，请仔细确认！`,
      onOk: () => {
        if (controller.getCurrentLayer() === canvasState.getLayers[index]) {
          controller.setCurrentLayer(null);
        }
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

  const dragStartRef = ref(-1);
  const dragEnterRef = ref(-1);
  function dragstart(e: DragEvent, index: number) {
    if (canvasState.layers[index].lock) {
      e.preventDefault();
      return;
    }
    e.dataTransfer?.setDragImage((e.target as HTMLElement).parentElement as HTMLElement, e.offsetX, e.offsetY);
    dragStartRef.value = index;
  }
  function dragenter(_, index: number) {
    // 避免源对象触发自身的dragenter事件
    dragEnterRef.value = index;
  }
  const [openLoading, closeLoading] = useLoading({ tip: '移动中', minTime: 1000 });
  function dragend(_) {
    if (dragStartRef.value < 0 || dragEnterRef.value < 0 || dragStartRef.value === dragEnterRef.value) {
      return;
    }
    const source = canvasState.layers[dragStartRef.value];
    canvasState.layers.splice(dragStartRef.value, 1);
    canvasState.layers.splice(dragEnterRef.value, 0, source);
    // 排序变化后目标对象的索引变成源对象的索引
    dragStartRef.value = -1;
    dragEnterRef.value = -1;

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
      .ant-input-disabled {
        background-color: transparent;
      }
    }
    .layer-index,
    .layer-name,
    .layer-option {
      height: 26px;
      border-right: 1px solid @color-border-table;
      border-bottom: 1px solid @color-border-table;
      text-align: center;
      line-height: 26px;
      font-size: 12px;
      .ant-btn {
        display: inline-block;
        height: 18px;
        width: 18px;
      }
      .ant-btn:hover {
        color: rgb(90, 90, 90);
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
        line-height: 26px;
        text-align: center;
        height: 100%;
        border: 0;
      }
      span {
        font-size: 12px;
        line-height: 26px;
      }
    }
    .layer-option {
      width: 120px;
      border-right: 0;
    }
  }
</style>
