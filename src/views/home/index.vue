<template>
  <div class="home-container">
    <div class="home-left">
      <div class="home-info">
        <div> 地图编辑器 </div>
        <div> 版本：0.0.1 </div>
      </div>
      <div class="home-options">
        <div class="button-wrapper">
          <a-button type="primary" @click="() => handleOpenProject('')">
            <icon-plus />
          </a-button>
          <div>新建项目</div>
        </div>
        <div class="button-wrapper">
          <a-button type="primary" @click="handleUploadProject">
            <icon-import />
          </a-button>
          <div>从文件打开项目</div>
        </div>
        <div class="button-wrapper" v-if="!isLocal()">
          <a-button type="primary" @click="handleUploadProject">
            <icon-cloud-download />
          </a-button>
          <div>获取桌面版</div>
        </div>
        <div class="button-wrapper" v-else>
          <a-button type="primary" disabled @click="handleUploadProject">
            <icon-cloud-download />
          </a-button>
          <div>检查更新</div>
        </div>
      </div>
    </div>
    <div class="history-list home-right">
      <a-list size="small" :bordered="false" :data="dataSource" :pagination-props="paginationProps">
        <template #header>
          <div class="history-title"> - 历史记录 - </div>
          <a-button type="text" class="history-refresh" :disable="!isLocal()" @click="getHistory">
            <icon-refresh></icon-refresh>
            刷新
          </a-button>
        </template>
        <template #item="{ item }">
          <a-list-item class="list-item" action-layout="vertical">
            <template #actions>
              <span @click="() => handleOpenProject(item.title)"><icon-launch />打开</span>
              <span><icon-download />下载</span>
              <!-- <span><icon-heart />置顶</span> -->
              <span @click="() => handleDeleteProject(item.title)"><icon-delete />删除</span>
            </template>
            <a-list-item-meta
              :class="[item.top ? 'top' : '']"
              :title="item.title"
              :description="item.description"
            />
          </a-list-item>
        </template>
      </a-list>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { getLocalApi, isLocal } from '@/utils/env';
  import type { LocalMapHistory } from './common/types';
  import { reactive, ref } from 'vue';
  import { isArray } from '@/utils/is';
  import modal from '@arco-design/web-vue/es/modal';

  const dataSource = ref<LocalMapHistory[]>([]);
  const paginationProps = reactive({
    defaultPageSize: 5,
    total: dataSource.value.length,
  });

  function getHistory() {
    getLocalApi()
      .getLocalHistoryList()
      .then((data: LocalMapHistory[]) => {
        if (isArray(data)) {
          dataSource.value = data;
        }
      });
  }
  getHistory();

  function handleOpenProject(project: string) {
    // location.href = '/#/map-editor?name=' + project;
    window.open('/#/map-editor?name=' + project);
  }
  function handleUploadProject() {}
  function handleDeleteProject(fileName: string) {
    modal.confirm({
      title: '确认',
      content: `删除数据存档${fileName}?`,
      onOk: () => {
        getLocalApi().deleteLocalFile(fileName);
        getHistory();
      },
    });
  }
</script>

<style lang="less">
  .home-container {
    display: flex;
    justify-content: space-around;
    height: 100vh;
    width: 50vw;
    min-width: 600px;
    margin: 0 auto;
    margin-top: 150px;
  }
  .home-left {
    flex: 1;
    padding: 20px;
    height: 480px;
    border: 1px solid #746c5f;
  }
  .home-info {
    padding-left: 60px;
    font-size: 16px;
    font-weight: bold;
    color: var(--color-text-1);
  }
  .home-options {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    padding: 20px;
    .button-wrapper {
      font-size: 16px;
      line-height: 28px;
      text-align: center;
      margin-top: 50px;
      button {
        width: 80%;
        height: 60px;
        border-radius: 10px;
      }
      .arco-icon {
        width: 22px;
        height: 22px;
      }
    }
  }
  .history-list {
    flex: 1;
    height: 480px;
    border: 1px solid #746c5f;
    padding: 20px;
    .history-title {
      font-size: 16px;
      font-weight: bold;
    }
    .history-refresh {
      position: absolute;
      top: 0;
      right: 0;
    }
    .list-item {
      color: var(--color-text-2);
    }
    .top .arco-list-item-meta-title {
      color: red !important;
    }
  }
</style>
