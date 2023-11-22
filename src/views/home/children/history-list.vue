<template>
  <div class="history-list">
    <a-space class="opt-button-group">
      <a-button @click="() => handleOpenProject('')"> <plus-outlined />新建项目 </a-button>
      <a-upload :before-upload="(file) => handleLoadSaves(file)" accept=".json" :showUploadList="false">
        <a-button> <import-outlined />打开文件 </a-button>
      </a-upload>
      <a-button @click="handleShowLinkModal"> <link-outlined />读取链接 </a-button>
      <a-button @click="handleShowShareModal"> <link-outlined />查看共享目录 </a-button>
      <a-button class="history-refresh" :disable="!isLocal()" @click="refreshHistory(false)">
        <sync-outlined> </sync-outlined>
        刷新
      </a-button>
      <a-dropdown>
        <button class="ant-btn">
          <more-outlined></more-outlined>
        </button>
        <template #overlay>
          <a-menu>
            <a-menu-item key="0">
              <div class="history-open" :disable="!isLocal()" @click="openSavesFolder">
                <folder-open-filled> </folder-open-filled>
                访问存档目录
              </div>
            </a-menu-item>
            <a-menu-item key="1">
              <div class="history-refresh" :disable="!isLocal()" @click="createShortcut()">
                <desktop-outlined />
                创建快捷方式
              </div>
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </a-space>
    <a-tooltip title="用户设置" placement="bottom">
      <a class="settings" @click.prevent="handleOpenConfig">
        <setting-outlined></setting-outlined>
      </a>
    </a-tooltip>
    <project-list :dataSource="dataSource" @refresh-list="refreshHistory"></project-list>
    <user-config-modal :visible="userConfigModalVisibleRef" @close="userConfigModalVisibleRef = false" />
    <share-link-modal :visible="linkModalVisibleRef" @close="() => (linkModalVisibleRef = false)" />
    <share-directory-modal
      :visible="shareModalVisibleRef"
      @success="handleDownloadSuccess"
      @close="() => (shareModalVisibleRef = false)"
    />
  </div>
</template>

<script setup lang="ts">
  import { getLocalApi, isLocal } from '@/utils/env';
  import type { LocalMapHistory } from '../common/types';
  import { ref } from 'vue';
  import { isArray } from '@/utils/is';
  import { message } from 'ant-design-vue';
  import {
    PlusOutlined,
    ImportOutlined,
    LinkOutlined,
    SyncOutlined,
    FolderOpenFilled,
    SettingOutlined,
    MoreOutlined,
    DesktopOutlined,
  } from '@ant-design/icons-vue';
  import { useLoading } from '@/components/Loading';
  import { loadSaves } from '@/utils/persist';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import ProjectList from './project-list.vue';
  import UserConfigModal from '@/components/navbar/user-config-modal.vue';
  import ShareLinkModal from './share-link-modal.vue';
  import ShareDirectoryModal from './share-directory-modal.vue';

  const localApi = getLocalApi();
  const dataSource = ref<LocalMapHistory[]>([]);

  function refreshHistory(silence: boolean = false) {
    localApi?.getLocalFileList().then((data: LocalMapHistory[]) => {
      if (isArray(data)) {
        dataSource.value = data;
        !silence && message.success('刷新成功！');
      }
    });
  }
  refreshHistory(true);

  function openSavesFolder() {
    localApi?.openFolder('');
  }

  async function handleOpenProject(project: string) {
    // location.href = '/#/map-editor?name=' + project;
    const url = location.href.slice().replace(/#\/.+/, '#/map-editor?name=' + project);
    const config = await localApi?.getCustomConfig();
    if (localApi && config && config.openProjectInNewWindow) {
      localApi.newWindow(url);
    } else {
      location.replace(url);
      // 刷新加载存档
      setTimeout(() => {
        location.reload();
        localApi && localApi.maximizeWindow();
      });
    }
  }

  const [openLoading, closeLoading] = useLoading({ tip: '加载中！', minTime: 1000 });
  const canvasState = useCanvasState();
  function handleLoadSaves(file: File) {
    openLoading();
    var reader = new FileReader(); //调用FileReader
    reader.readAsText(file); //将文件读取为 text
    reader.onload = function (evt) {
      try {
        const result = loadSaves(String(evt.target?.result), true);
        canvasState.setLayers(result.layers);

        const url = location.href.slice().replace(/#\/.+/, '#/map-editor?name=' + file.name);
        location.replace(url);
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

  const userConfigModalVisibleRef = ref();
  function handleOpenConfig() {
    userConfigModalVisibleRef.value = true;
  }

  const linkModalVisibleRef = ref(false);
  function handleShowLinkModal() {
    linkModalVisibleRef.value = true;
  }

  const shareModalVisibleRef = ref(false);
  function handleShowShareModal() {
    shareModalVisibleRef.value = true;
  }
  function handleDownloadSuccess() {
    shareModalVisibleRef.value = false;
    refreshHistory(false);
  }

  function createShortcut() {
    localApi?.createShortcut();
  }
</script>

<style lang="less">
  .home-container .history-list {
    flex: 1;
    height: 100%;
    padding: 20px;
    .opt-button-group {
      display: flex;
      margin-left: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #4a6272;
      .ant-btn {
        width: auto;
        font-size: 12px;
        background: #333333;
        &:hover {
          color: white;
          background: #444444;
        }
      }
    }
  }
  .settings {
    position: absolute;
    right: 30px;
    top: 60px;
    color: @color-text-1;
    .anticon-setting {
      font-size: 16px;
    }
  }
</style>
