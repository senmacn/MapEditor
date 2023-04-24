<template>
  <div class="layer-list">
    <div class="layer-item title">
      <div class="layer-index">序号</div>
      <div class="layer-name"> 名称 </div>
      <div class="layer-option"> 操作 </div>
    </div>
    <transition-group name="list" tag="ul">
      <li class="layer-item" v-for="(layer, index) in layersRef" :key="layer.uuid">
        <div class="layer-content">
          <div
            class="layer-index"
            draggable
            @dragenter="dragenter($event, index)"
            @dragover.prevent
            @dragstart="dragstart(index)"
          >
            <icon-fire v-if="layer.hot" />
            {{ index + 1 }}
          </div>
          <div class="layer-name">
            <a-input type="text" v-model="layer.name" />
          </div>
          <div class="layer-option">
            <a-tooltip content="隐藏图层">
              <a-button
                type="text"
                v-if="layer.visible"
                status="success"
                @click="() => changeLayerVisible(layer, false)"
              >
                <template #icon>
                  <icon-eye />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip content="显示图层">
              <a-button
                type="text"
                status="normal"
                v-if="!layer.visible"
                @click="() => changeLayerVisible(layer, true)"
              >
                <template #icon>
                  <icon-eye-invisible />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip content="显示区域">
              <a-button
                type="text"
                @click="() => handleChangeAreaVisible(layer.uuid)"
                status="normal"
              >
                <template #icon>
                  <icon-menu-fold v-if="!hiddenAreaMapRef[layer.uuid]" />
                  <icon-menu-unfold v-else />
                </template>
              </a-button>
            </a-tooltip>
            <a-upload @beforeUpload="(file) => handleUploadFile(file, index)" accept=".png,.jpg">
              <template #upload-button>
                <a-tooltip content="上传底图">
                  <a-button type="text" :class="layer.map ? 'success' : 'none'">
                    <template #icon>
                      <icon-file-image />
                    </template>
                  </a-button>
                </a-tooltip>
              </template>
            </a-upload>
            <a-button type="text" status="warning" @click="() => handleLayerDelete(index)">
              <template #icon>
                <icon-delete />
              </template>
            </a-button>
          </div>
        </div>
        <area-list
          v-if="!hiddenAreaMapRef[layer.uuid] && layer.areas.length"
          :areas="layer.areas"
        />
      </li>
    </transition-group>
    <a-tooltip content="添加图层">
      <a-button @click="handleLayerAdd">+</a-button>
    </a-tooltip>
  </div>
</template>

<script setup lang="ts">
  import { Ref, inject, ref } from 'vue';
  import AreaList from './area-list.vue';
  import modal from '@arco-design/web-vue/es/modal';
  import { getRandomDomId } from '../../../utils/uuid';
  import { useLoading } from '../../../components/Loading';
  import { Layer } from '../common/types';

  const layersRef: Ref<Layer[]> = inject('layers', [] as any);

  // 当前聚焦
  const refreshHot = () => {
    let isHot = false;
    for (let index = layersRef.value.length - 1; index >= 0; index--) {
      const element = layersRef.value[index];
      element.hot = false;
      if (element.visible && !isHot) {
        element.hot = true;
        isHot = true;
        hiddenAreaMapRef.value[element.uuid] = false;
      }
    }
  };
  function changeLayerVisible(layer: Layer, visible: boolean) {
    layer.visible = visible;
    refreshHot();
  }
  function handleLayerAdd() {
    layersRef.value.push({
      uuid: getRandomDomId(),
      name: '图层' + (layersRef.value.length + 1),
      hot: true,
      visible: true,
      map: null,
      areas: [],
    });
    refreshHot();
  }
  function handleLayerDelete(index: number) {
    modal.confirm({
      title: '确认',
      content: `删除[${layersRef.value[index].name}]的操作不可逆，请仔细确认！`,
      onOk: () => {
        layersRef.value.splice(index, 1);
        refreshHot();
      },
    });
  }

  const [openLoading, closeLoading] = useLoading({ tip: '正在上传图片！' });
  function handleUploadFile(file: File, index: number) {
    openLoading();
    var reader = new FileReader(); //调用FileReader
    reader.readAsDataURL(file); //将文件读取为 DataURL(base64)
    reader.onload = function (evt) {
      layersRef.value[index].map = String(evt.target?.result);
      layersRef.value[index].visible = true;
      closeLoading();
    };
    return Promise.reject() as any;
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
      const source = layersRef.value[dragIndexRef.value];
      layersRef.value.splice(dragIndexRef.value, 1);
      layersRef.value.splice(index, 0, source);
      // 排序变化后目标对象的索引变成源对象的索引
      dragIndexRef.value = index;
      refreshHot();
    }
  }

  const hiddenAreaMapRef = ref<Recordable<boolean>>({});
  function handleChangeAreaVisible(uuid: string) {
    hiddenAreaMapRef.value[uuid] = !hiddenAreaMapRef.value[uuid];
  }
</script>

<style lang="less">
  .layer-list {
    border: 1px solid var(--color-border-3);
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
    > .arco-btn {
      width: 100% !important;
      height: 24px !important;
    }
  }
  .arco-icon {
    font-size: 14px;
  }
  .arco-icon-fire {
    color: rgb(255, 50, 48) !important;
  }

  .layer-item {
    list-style: none;
    border-bottom: 1px solid var(--color-border-2);
    &.title {
      display: flex;
      font-weight: bold;
      background: var(--color-fill-2);
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
      border-right: 1px solid var(--color-border-2);
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
      input.arco-input {
        font-size: 12px;
        line-height: 24px;
        text-align: center;
      }
      span {
        font-size: 12px;
        line-height: 24px;
      }
    }
    .layer-option {
      width: 140px;
      border-right: 0;
      button {
        height: 24px;
      }
      .success {
        color: rgb(0, 180, 42);
        &:hover {
          color: rgb(0, 180, 42);
        }
      }
      .none {
        color: #ccc;
      }
    }
    .arco-upload-wrapper {
      display: inline-block;
    }
    .arco-input-wrapper {
      height: 100%;
      background-color: rgb(250, 250, 250);
    }
  }
</style>
