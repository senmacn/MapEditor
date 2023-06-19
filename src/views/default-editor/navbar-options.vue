<template>
  <a-space>
    <a-dropdown @click.prevent :trigger="['click']" overlayClassName="navbar-menu-wrapper">
      <div class="nav-item"> 文件 </div>
      <template #overlay>
        <a-menu>
          <a-menu-item key="0">
            <div class="inner-content" @click="handleOpenProject">新建窗口</div>
          </a-menu-item>
          <a-divider></a-divider>
          <a-menu-item key="1" v-if="isLocal()">
            <div class="inner-content" @click="handleOpenCreateModal">保存文件</div>
          </a-menu-item>
          <a-menu-item key="2">
            <div class="inner-content" @click="handleOpenExportModal">导出文件</div>
          </a-menu-item>
          <a-menu-item key="3">
            <a-upload
              :before-upload="(file) => handleLoadSaves(file)"
              accept=".json"
              :showUploadList="false"
            >
              <div class="inner-content">加载文件</div>
            </a-upload>
          </a-menu-item>
          <a-divider></a-divider>
          <a-menu-item key="4">
            <div class="inner-content" @click="handleOpenDownloadModal">坐标下载</div>
          </a-menu-item>
          <a-menu-item key="5">
            <div class="inner-content" @click="colorImageVisibleRef = true">色值图下载</div>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
    <a-dropdown @click.prevent :trigger="['click']" overlayClassName="navbar-menu-wrapper">
      <div class="nav-item"> 设置 </div>
      <template #overlay>
        <a-menu>
          <a-menu-item key="0">
            <div class="inner-content" @click="handleChangeMapSize">尺寸设置</div>
          </a-menu-item>
          <a-menu-item key="1">
            <div class="inner-content" @click="handleShowEditConfig">编辑设置</div>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </a-space>
  <change-map-size-modal
    :visible="changeMapSizeModalVisible"
    @close="changeMapSizeModalVisible = false"
  />
  <display-output-modal :visible="displayOutputVisibleRef" @cancel="handleConfirmCancelExport" />
  <color-image-modal :visible="colorImageVisibleRef" @cancel="handleColorImageExport" />
  <export-modal
    :visible="exportModalRef"
    :layers="canvasState.layers"
    @emit-close-export="handleCloseExport"
    @emit-format-exp-data="handleFormatExpData"
  />
  <edit-config-modal
    :visible="editConfigModalVisible"
    @close="editConfigModalVisible = false"
  ></edit-config-modal>
</template>

<script setup lang="ts">
  import { useLoading } from '@/components/Loading';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { getLocalApi, isLocal } from '@/utils/env';
  import { loadSaves } from '@/utils/persist';
  import { message } from 'ant-design-vue';
  import useSaves from './hooks/useSaves';
  import ChangeMapSizeModal from './children/change-map-size-modal.vue';
  import DisplayOutputModal from './children/display-output-modal.vue';
  import ColorImageModal from './children/color-image-modal.vue';
  import ExportModal from './children/export-modal.vue';
  import EditConfigModal from './children/edit-config-modal.vue';
  import { ref } from 'vue';
  import { useLocalState } from '@/store/modules/local-state';

  const localApi = getLocalApi();
  const configRef = useEditorConfig();
  const canvasState = useCanvasState();
  const localState = useLocalState();

  function handleOpenProject() {
    const url = location.href.slice().replace(/\#\/.+/, '#/map-editor?name=');
    isLocal() ? localApi?.newWindow(url) : window.open(url);
  }

  // 保存文件
  const [handleCreateSaves, handleExportSaves] = useSaves();
  function handleOpenCreateModal() {
    if (isLocal() && !localState.getExportLocation) {
      message.warning('请设置存档导出位置！');
      return;
    }
    handleCreateSaves({});
  }

  // 导出文件
  const exportModalRef = ref(false);
  function handleOpenExportModal() {
    if (isLocal() && !localState.getExportLocation) {
      message.warning('请设置存档导出位置！');
      return;
    }
    exportModalRef.value = true;
  }
  function handleCloseExport() {
    exportModalRef.value = false;
  }
  function handleFormatExpData(data: any) {
    const { layers, areas } = data;
    const expLayerAreaData: any = [];
    for (let i = 0; i < layers.length; i += 1) {
      expLayerAreaData.push({
        ...canvasState.layers.slice(layers[i], layers[i] + 1)[0],
        areas: [],
      });
    }
    for (let i = 0; i < areas.length; i += 1) {
      if (!areas[i].length) {
        continue;
      }
      for (let j = 0; j < areas[i].length; j += 1) {
        expLayerAreaData[i]
          ? expLayerAreaData[i].areas.push(canvasState.layers[i].areas[areas[i][j]])
          : expLayerAreaData[i - 1].areas.push(canvasState.layers[i].areas[areas[i][j]]);
      }
    }
    handleExportSaves(expLayerAreaData);
  }

  // 加载文件
  const [openLoading, closeLoading] = useLoading({ tip: '加载中！', minTime: 1000 });
  function handleLoadSaves(file: File) {
    openLoading();
    var reader = new FileReader(); //调用FileReader
    reader.readAsText(file); //将文件读取为 text
    reader.onload = function (evt) {
      try {
        const result = loadSaves(String(evt.target?.result), [
          configRef.getSize.x,
          configRef.getSize.y,
        ]);
        const initLayers = canvasState.getLayers.slice();
        // 混入
        result.layers.forEach((layer) => {
          ``;
          let flag = false;
          initLayers.forEach((initLayer) => {
            if (initLayer.name === layer.name) {
              initLayer.areas = initLayer.areas.concat(layer.areas);
              if (layer.map) {
                initLayer.map = layer.map;
                initLayer.transparency = layer.transparency;
              }
              flag = true;
            }
          });
          if (!flag) {
            initLayers.push(layer);
          }
        });
        canvasState.setLayers(initLayers);
      } catch (e: any) {
        message.warning({
          content: e.message,
          duration: 60000,
        });
      }
      closeLoading();
    };
    return Promise.reject() as any;
  }

  const displayOutputVisibleRef = ref(false);
  function handleConfirmCancelExport() {
    displayOutputVisibleRef.value = false;
  }
  function handleOpenDownloadModal() {
    if (!localState.getDownloadLocation) {
      message.warning('请设置坐标下载位置！');
      return;
    }
    displayOutputVisibleRef.value = true;
  }

  const colorImageVisibleRef = ref(false);
  function handleColorImageExport() {
    colorImageVisibleRef.value = false;
  }

  // 尺寸设置
  const changeMapSizeModalVisible = ref(false);
  function handleChangeMapSize() {
    changeMapSizeModalVisible.value = true;
  }

  // 编辑设置
  const editConfigModalVisible = ref(false);
  function handleShowEditConfig() {
    editConfigModalVisible.value = true;
  }
</script>

<style lang="less">
  .nav-item {
    width: 60px;
    height: 30px;
    text-align: center;
    line-height: 30px;
    border-radius: 4px;
    color: @color-text-1;
    cursor: pointer;
    user-select: none;
    &:hover {
      background-color: @color-border-3;
    }
    &[disabled='true'] {
      color: @color-text-3;
    }
  }
  .navbar-menu-wrapper {
    .ant-dropdown-menu {
      width: 120px;
      text-align: center;
      background: #232b36;
      border: 1px solid @color-border-3;
      border-radius: 4px;
    }
    .ant-dropdown-menu-item {
      padding: 0;
    }
    .ant-upload {
      width: 100%;
    }
    .ant-divider {
      margin: 3px 0;
    }
    .inner-content {
      margin: 3px;
      padding: 4px;
      font-size: 12px;
      &:hover {
        background-color: @color-border-3;
      }
    }
  }
</style>
