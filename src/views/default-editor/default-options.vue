<template>
  <div v-if="!drawerVisibleRef" class="open-drawer" @click="drawerVisibleRef = true">
    <img src="@/assets/images/map-open.png" />
  </div>
  <a-drawer
    class="option-drawer"
    placement="right"
    :width="400"
    :visible="drawerVisibleRef"
    :mask="false"
    @close="drawerVisibleRef = false"
  >
    <div v-if="drawerVisibleRef" class="close-drawer" @click="drawerVisibleRef = false">
      <right-outlined />
    </div>
    <div class="default-option">
      <a-row class="option-group">
        <a-col class="row-label" :span="4">
          <span class="group-label">搜索 </span>
        </a-col>
        <a-col :span="24">
          <a-input-group compact>
            <a-select v-model:value="searchTypeRef" style="width: 30%">
              <a-select-option :value="0">区域名称</a-select-option>
              <a-select-option :value="1">区域类型</a-select-option>
            </a-select>
            <a-input-search
              v-model:value="searchValueRef"
              style="width: 70%"
              @search="handleSearch"
            />
          </a-input-group>
        </a-col>
        <a-col class="row-label" :span="4">
          <span class="group-label">图层</span>
        </a-col>
        <a-col :span="24">
          <layer-list></layer-list>
        </a-col>
      </a-row>
      <area-options
        @end-edit-area="(...props) => emit('end-edit-area', props[0], props[1], props[2])"
      />
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import LayerList from './children/layer-list.vue';
  import AreaOptions from './children/area-options.vue';
  import { RightOutlined } from '@ant-design/icons-vue';
  import { useCanvasState } from '@/store/modules/canvas-state';

  const emit = defineEmits<{
    (e: 'end-edit-area', name: string, type: string, complete: boolean): void;
  }>();

  const drawerVisibleRef = ref(true);

  const canvasState = useCanvasState();
  const searchTypeRef = ref(0);
  const searchValueRef = ref('');
  function handleSearch() {
    const layers = canvasState.getLayers;

    for (const layer of layers) {
      for (const area of layer.areas) {
        if (searchTypeRef.value) {
          area.visible = area.type[0].includes(searchValueRef.value);
        } else {
          area.visible = area.getName().includes(searchValueRef.value);
        }
      }
    }
  }
</script>

<style lang="less">
  .option-drawer {
    position: fixed;
    width: 400px;
    max-height: 75%;
    margin: 130px 35px 20px 0;
    border-radius: 3px;
    transition: width 0.2s ease;
    .ant-drawer-content {
      overflow: visible;
      border-radius: 10px;
      background-color: rgb(47, 47, 47);
      border: 1px solid rgb(81, 81, 81);
    }
    .ant-select-arrow {
      top: 45%;
    }
    .ant-drawer-header {
      display: none;
    }
    .ant-drawer-body {
      padding: 10px;
      &::-webkit-scrollbar {
        width: 0;
      }
    }
    .ant-drawer-content-wrapper {
      transform: translate(150%, -100%) !important;
      overflow: hidden;
    }
    &.ant-drawer-open {
      .ant-drawer-content-wrapper {
        overflow: visible;
        transform: translate(0, 0) !important;
      }
    }
  }
  .default-option {
    overflow: hidden;
    color: #d4d4d4;
    .ant-upload-wrapper {
      width: auto;
    }
    .ant-select {
      width: 90px;
      height: 38px;
    }
    .ant-row {
      align-items: center;
      margin: 10px;
      .ant-col {
        margin-bottom: 6px;
        font-size: 12px;
      }
      .row-label {
        font-weight: bold;
        font-size: 14px;
      }
      .ant-btn-group {
        .pcr-button {
          height: 32px;
          width: 32px;
          margin-left: 1px;
        }
      }
      .ant-input-number {
        width: 80px;
      }
    }
    .pickr-wrapper {
      display: flex;
      align-items: center;
    }
    .ant-btn.actived {
      color: @color-text-2;
      background-color: @color-bg-1;
      border-color: transparent;
    }
    .option-group {
      border-bottom: 1px solid @color-border-1;
    }
    .ant-btn {
      font-size: 12px;
      width: 80px;
      height: 32px;
    }
    .ant-input-wrapper {
      background-color: transparent;
      border-color: @color-fill-3;
    }
  }
  .close-drawer {
    position: absolute;
    top: 5px;
    left: -48px;
    height: 40px;
    width: 50px;
    border-radius: 5px;
    line-height: 45px;
    border: 1px solid rgb(81, 81, 81);
    border-right: 0;
    background-color: rgb(47, 47, 47);
    z-index: 999;
    cursor: pointer;
    .anticon {
      font-size: 24px;
      color: @color-text-1;
    }
  }
  .open-drawer {
    position: fixed;
    top: 120px;
    right: 80px;
    z-index: 999;
    text-align: center;
    line-height: 80px;
    cursor: pointer;
    img {
      height: 70px;
      width: 70px;
    }
  }
</style>
