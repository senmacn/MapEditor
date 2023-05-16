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
              <a-tooltip title="显示区域">
                <a-button type="text" @click="() => handleChangeAreaVisible(layer.uuid)">
                  <template #icon>
                    <menu-fold-outlined v-if="!hiddenAreaMapRef[layer.uuid]" />
                    <menu-unfold-outlined v-else />
                  </template>
                </a-button>
              </a-tooltip>
              <a-upload
                @beforeUpload="(file) => handleUploadFile(file, index)"
                accept=".png,.jpg"
                :showUploadList="false"
              >
                <a-tooltip title="上传底图">
                  <a-button type="text" :class="layer.map ? 'success' : 'none'">
                    <template #icon>
                      <file-image-outlined />
                    </template>
                  </a-button>
                </a-tooltip>
              </a-upload>
              <a-button type="text" @click="() => handleLayerDelete(index)">
                <template #icon>
                  <delete-outlined />
                </template>
              </a-button>
            </a-space>
          </div>
        </div>
        <area-list v-if="!hiddenAreaMapRef[layer.uuid]" :areas="layer.areas" :pins="layer.pins" />
      </li>
    </transition-group>
    <a-tooltip title="添加图层">
      <a-button @click="handleLayerAdd">+</a-button>
    </a-tooltip>
  </div>
</template>

<script setup lang="ts">
  import { Ref, inject, ref } from 'vue';
  import AreaList from './area-list.vue';
  import modal from 'ant-design-vue/lib/modal';
  import { getRandomDomId } from '../../../utils/uuid';
  import { useLoading } from '@/components/Loading';
  import { Layer } from '../common/types';
  import {
    FileImageOutlined,
    FireOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    DeleteOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
  } from '@ant-design/icons-vue';

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
      pins: [],
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
    border: 1px solid rgba(74, 83, 102, 0.5);
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
    border-bottom: 1px solid rgba(74, 83, 102, 0.5);
    &.title {
      display: flex;
      font-weight: bold;
      background: rgba(74, 83, 102, 0.5);
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
      border-right: 1px solid rgba(74, 83, 102, 0.5);
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
  }
</style>
