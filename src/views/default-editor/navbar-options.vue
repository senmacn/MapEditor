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
            <a-upload :before-upload="(file) => handleLoadSaves(file)" accept=".json" :showUploadList="false">
              <div class="inner-content">加载文件</div>
            </a-upload>
          </a-menu-item>
          <a-menu-item key="4">
            <div class="inner-content" @click="handleOpenHistoryModal">历史版本</div>
          </a-menu-item>
          <a-divider></a-divider>
          <a-menu-item key="5">
            <div class="inner-content" @click="handleOpenDownloadModal">坐标下载</div>
          </a-menu-item>
          <a-menu-item key="6">
            <div class="inner-content" @click="handleOpenColorExport">色值图下载</div>
          </a-menu-item>
          <a-menu-item key="7">
            <div class="inner-content" @click="handleAreaBoundaryExport">边框数据下载</div>
          </a-menu-item>
          <a-menu-item key="8">
            <div class="inner-content" @click="handleUIImageExport">UI图下载</div>
          </a-menu-item>
          <a-menu-item key="9">
            <div class="inner-content" @click="handlePathwayExport">路径导出</div>
          </a-menu-item>
          <a-divider></a-divider>
          <a-menu-item key="10">
            <div class="inner-content" @click="handleCloseProject">关闭项目</div>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
    <a-dropdown @click.prevent :trigger="['click']" overlayClassName="navbar-menu-wrapper">
      <div class="nav-item"> 设置 </div>
      <template #overlay>
        <a-menu>
          <a-menu-item key="0">
            <div class="inner-content" @click="handleChangeMapSize">项目设置</div>
          </a-menu-item>
          <a-menu-item key="1">
            <div class="inner-content" @click="handleShowEditConfig">编辑设置</div>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </a-space>
  <project-size-config-modal
    :visible="projectSizeConfigModalVisible"
    @change-size="handleMapSizeChanged"
    @close="projectSizeConfigModalVisible = false"
  />
  <history-modal :visible="historyOutputVisibleRef" @close="handleCloseHistoryModal" />
  <display-output-modal :visible="displayOutputVisibleRef" @cancel="handleConfirmCancelExport" />
  <color-image-modal :visible="colorImageVisibleRef" @cancel="handleColorImageExport" />
  <pathway-export-modal :visible="pathwayExportVisibleRef" @close="pathwayExportVisibleRef = false" />
  <export-modal
    :visible="exportModalRef"
    :layers="canvasState.getLayers"
    @emit-close-export="handleCloseExport"
    @emit-format-exp-data="handleFormatExpData"
  />
  <edit-config-modal :visible="editConfigModalVisible" @close="editConfigModalVisible = false"></edit-config-modal>
  <boundary-export-modal
    :visible="boundaryExportVisible"
    @close="boundaryExportVisible = false"
  ></boundary-export-modal>
  <ui-image-export-modal :visible="uiImageExportVisible" @close="uiImageExportVisible = false"></ui-image-export-modal>
</template>

<script setup lang="ts">
  import { useLoading } from '@/components/Loading';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { getLocalApi, isLocal } from '@/utils/env';
  import { loadNewSaves } from '@/utils/persist';
  import { Modal, message } from 'ant-design-vue';
  import useSaves from './hooks/useSaves';
  import ProjectSizeConfigModal from './children/project-size-config-modal.vue';
  import HistoryModal from './children/history-modal.vue';
  import DisplayOutputModal from './children/display-output-modal.vue';
  import ColorImageModal from './children/color-image-modal.vue';
  import BoundaryExportModal from './children/boundary-export-modal.vue';
  import PathwayExportModal from './children/pathway-export-modal.vue';
  import ExportModal from './children/export-modal.vue';
  import EditConfigModal from './children/edit-config-modal.vue';
  import UiImageExportModal from './children/ui-image-export-modal.vue';
  import { ref } from 'vue';
  import { useLocalState } from '@/store/modules/local-state';
  import { useRouter } from 'vue-router';

  const localApi = getLocalApi();
  const configRef = useEditorConfig();
  const canvasState = useCanvasState();
  const localState = useLocalState();

  function handleOpenProject() {
    const url = location.href.slice().replace(/#\/.+/, '#/map-editor?name=');
    isLocal() ? localApi?.newWindow(url) : window.open(url);
  }

  // 保存文件
  const { handleConfirmCreateSaves, handleCreateSaves, handleExportSaves } = useSaves();
  function handleOpenCreateModal() {
    handleConfirmCreateSaves();
  }

  // 导出文件
  const exportModalRef = ref(false);
  function handleOpenExportModal() {
    if (isLocal() && !localState.getExportLocation) {
      message.warning('请设置存档位置！');
      return;
    }
    exportModalRef.value = true;
  }
  function handleCloseExport() {
    exportModalRef.value = false;
  }
  function handleFormatExpData(data: any) {
    // TODO: 导出pathways
    const { layers, areas, pins, pathways } = data;
    const expLayerAreaData: any = [];
    for (let i = 0; i < layers.length; i += 1) {
      expLayerAreaData.push({
        ...canvasState.layers.slice(layers[i], layers[i] + 1)[0],
        areas: [],
        pathways: [],
        pins: [],
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
    for (let i = 0; i < pins.length; i += 1) {
      if (!pins[i].length) {
        continue;
      }
      for (let j = 0; j < pins[i].length; j += 1) {
        expLayerAreaData[i]
          ? expLayerAreaData[i].pins.push(canvasState.layers[i].pins[pins[i][j]])
          : expLayerAreaData[i - 1].pins.push(canvasState.layers[i].pins[pins[i][j]]);
      }
    }
    for (let i = 0; i < pathways.length; i += 1) {
      if (!pathways[i].length) {
        continue;
      }
      for (let j = 0; j < pathways[i].length; j += 1) {
        expLayerAreaData[i]
          ? expLayerAreaData[i].pathways.push(canvasState.layers[i].pathways[pathways[i][j]])
          : expLayerAreaData[i - 1].pathways.push(canvasState.layers[i].pathways[pathways[i][j]]);
      }
    }
    handleExportSaves(expLayerAreaData);
  }

  // 加载文件
  const [openLoading, closeLoading] = useLoading({ tip: '加载中！', minTime: 1000 });
  function executeSaves(file: File, useConfig = true) {
    openLoading();
    var reader = new FileReader(); //调用FileReader
    reader.readAsText(file); //将文件读取为 text
    reader.onload = function (evt) {
      try {
        const result = loadNewSaves(String(evt.target?.result), useConfig, [
          configRef.getProjectSizeConfig.offsetWidth,
          configRef.getProjectSizeConfig.offsetHeight,
        ]);
        const initLayers = canvasState.getLayers.slice();
        // 混入
        result.layers.forEach((layer) => {
          let flag = false;
          initLayers.forEach((initLayer) => {
            if (initLayer.name === layer.name) {
              initLayer.areas = initLayer.areas.concat(layer.areas);
              initLayer.pins = initLayer.pins.concat(layer.pins);
              initLayer.visible = layer.visible;
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
      if (useConfig) {
        // 更新一下标尺
        setTimeout(() => {
          canvasState.setOffset({ x: 1, y: 1 });
        }, 50);
      }
    };
    return Promise.reject() as any;
  }
  function handleLoadSaves(file: File) {
    Modal.confirm({
      title: '提醒',
      content: '是否使用加载内容中的尺寸设置以及编辑设置？可能会覆盖已有的设置！',
      okText: '使用',
      cancelText: '跳过',
      onOk: () => {
        executeSaves(file, true);
      },
      onCancel: () => {
        executeSaves(file, false);
      },
    });
  }

  const historyOutputVisibleRef = ref(false);
  function handleCloseHistoryModal() {
    historyOutputVisibleRef.value = false;
  }
  function handleOpenHistoryModal() {
    historyOutputVisibleRef.value = true;
  }

  const displayOutputVisibleRef = ref(false);
  function handleConfirmCancelExport() {
    displayOutputVisibleRef.value = false;
  }
  function handleOpenDownloadModal() {
    if (isLocal() && !localState.getDownloadLocation) {
      message.warning('请设置坐标下载位置！');
      return;
    }
    displayOutputVisibleRef.value = true;
  }

  const boundaryExportVisible = ref(false);
  function handleAreaBoundaryExport() {
    if (isLocal() && !localState.getDownloadLocation) {
      message.warning('导出位置将使用【坐标下载位置】，确认已设置！');
      return;
    }
    boundaryExportVisible.value = true;
  }

  const uiImageExportVisible = ref(false);
  function handleUIImageExport() {
    if (isLocal() && !localState.getUIExportLocation) {
      message.warning('请设置UI图下载位置！');
      return;
    }
    uiImageExportVisible.value = true;
  }

  const colorImageVisibleRef = ref(false);
  function handleOpenColorExport() {
    if (isLocal() && !localState.getColorExportLocation) {
      message.warning('请设置色值图下载位置！');
      return;
    }
    colorImageVisibleRef.value = true;
  }
  function handleColorImageExport() {
    colorImageVisibleRef.value = false;
  }

  const pathwayExportVisibleRef = ref(false);
  function handlePathwayExport() {
    if (isLocal() && !localState.getDownloadLocation) {
      message.warning('导出位置将使用【坐标下载位置】，确认已设置！');
      return;
    }
    pathwayExportVisibleRef.value = true;
  }

  const router = useRouter();
  function handleCloseProject() {
    Modal.confirm({
      title: '提醒',
      content: '即将关闭项目并返回首页，请确认数据已保存！',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        router.push('/home');
        setTimeout(() => {
          location.reload();
        });
      },
    });
  }

  // 项目设置(新建的项目默认打开)
  const projectSizeConfigModalVisible = ref(localState.getFileName === '新建项目');
  function handleChangeMapSize() {
    projectSizeConfigModalVisible.value = true;
  }
  async function handleMapSizeChanged() {
    // 先保存存档，主要是为了保存尺寸设置
    const name = await handleCreateSaves();
    const url = location.href.slice().replace(/#\/.+/, '#/map-editor?name=' + name);
    location.replace(url);
    setTimeout(() => {
      location.reload();
    });
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
