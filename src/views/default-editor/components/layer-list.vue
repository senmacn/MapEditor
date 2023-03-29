<template>
  <div class="layer-list">
    <div class="layer-item title">
      <div class="layer-index">序号</div>
      <div class="layer-name">名称</div>
      <div class="layer-option">操作</div>
    </div>
    <transition-group name="list" tag="ul">
      <li class="layer-item" v-for="(layer, index) in layersRef" :key="layer.uuid">
        <div
          class="layer-index"
          :draggable="!layer.keep"
          @dragenter="dragenter($event, index)"
          @dragover="dragover($event, index)"
          @dragstart="dragstart(index)"
        >
          <icon-fire v-if="layer.hot" />
          {{ index + 1 }}
        </div>
        <div class="layer-name">
          <span v-if="layer.keep">{{ layer.name }}<icon-lock /></span>
          <a-input v-else type="text" v-model="layer.name" />
        </div>
        <div class="layer-option">
          <a-tooltip content="隐藏图层">
            <a-button
              type="text"
              v-if="layer.visible && !layer.keep"
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
              v-if="!layer.visible && !layer.keep"
              @click="() => changeLayerVisible(layer, true)"
            >
              <template #icon>
                <icon-eye-invisible />
              </template>
            </a-button>
          </a-tooltip>
          <a-upload
            @beforeUpload="(file) => handleUploadFile(file, index)"
            accept=".png,.jpg"
            v-if="layer.keep"
          >
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
          <a-button
            type="text"
            status="warning"
            @click="() => handleLayerDelete(index)"
            v-if="!layer.keep"
          >
            <template #icon>
              <icon-delete />
            </template>
          </a-button>
        </div>
      </li>
    </transition-group>
    <a-tooltip content="添加图层">
      <a-button @click="handleLayerAdd">+</a-button>
    </a-tooltip>
  </div>
</template>

<script setup lang="ts">
  import { Ref, inject, ref } from 'vue';
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
      }
    }
  };

  function changeLayerVisible(layer: Layer, visible: boolean) {
    layer.visible = visible;
    refreshHot();
  }

  function handleLayerDelete(index: number) {
    modal.confirm({
      title: '确认',
      content: `即将删除图层[${layersRef.value[index].name}],该操作不可逆，请仔细确认！`,
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
  function handleLayerAdd() {
    layersRef.value.push({
      uuid: getRandomDomId(),
      name: '图层' + (layersRef.value.length + 1),
      level: layersRef.value.length ? layersRef.value[layersRef.value.length - 1].level + 1 : 1,
      hot: true,
      visible: true,
      map: null,
    });
    refreshHot();
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
  function dragover(e: MouseEvent, index: number) {
    e.preventDefault();
  }
</script>

<style lang="less">
  .layer-list {
    border: 1px solid var(--color-border-4);
    width: 100%;
    ul {
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

  .layer-item {
    display: flex;
    width: 100%;
    list-style: none;
    border-bottom: 1px solid var(--color-border-4);
    &.title {
      font-weight: bold;
      div {
        background: var(--color-fill-4);
      }
    }
    > div {
      height: 24px;
      border-right: 1px solid var(--color-border-4);
      text-align: center;
      line-height: 24px;
      font-size: 12px;
    }
    > div:last-child {
      border-right: 0;
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
      .arco-icon {
        font-size: 14px;
      }
    }
    .layer-option {
      width: 120px;
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
    }
    button {
      width: 100%;
      height: 24px;
    }
  }

  .list-move,
  .list-enter-active,
  .list-leave-active {
    transition: all 0.5s ease;
  }
  .list-enter-from,
  .list-leave-to {
    opacity: 0;
    transform: translateX(30px);
  }
  /* 确保将离开的元素从布局流中删除
  以便能够正确地计算移动的动画。 */
  .list-leave-active {
    position: absolute;
  }
  .arco-icon-fire {
    color: rgb(255, 50, 48) !important;
  }
</style>
