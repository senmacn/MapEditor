<template>
  <div class="home-container">
    <div class="home-options">
      <div class="button-wrapper">
        <a-tooltip content="新建项目">
          <a-button type="primary" @click="() => handleOpenProject('')">
            <icon-plus />
          </a-button>
        </a-tooltip>
      </div>
      <div class="button-wrapper">
        <a-tooltip content="从文件打开项目">
          <a-button type="primary" @click="handleUploadProject">
            <icon-import />
          </a-button>
        </a-tooltip>
      </div>
    </div>
    <div class="history-list">
      <a-list :bordered="false" :data="dataSource" :pagination-props="paginationProps">
        <template #header>
          <div class="history-title"> - 历史记录 - </div>
        </template>
        <template #item="{ item }">
          <a-list-item class="list-item" action-layout="vertical">
            <template #actions>
              <span @click="() => handleOpenProject(item.title)"><icon-launch />打开</span>
              <span><icon-download />下载</span>
              <span><icon-heart />置顶</span>
              <span><icon-delete />删除</span>
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
  import type { LocalMapHistory } from './common/types';
  import { reactive, ref } from 'vue';

  const dataSource = ref<LocalMapHistory[]>([
    {
      index: 1,
      title: 'aaa',
      description: '',
      top: true,
    },
    {
      index: 2,
      title: 'aaa',
      description: '',
      top: true,
    },
    {
      index: 3,
      title: 'aaa',
      description: '',
      top: false,
    },
    {
      index: 5,
      title: 'aaa',
      description: '',
      top: false,
    },
    {
      index: 5,
      title: 'aaa',
      description: '',
      top: false,
    },
    {
      index: 6,
      title: 'aaa',
      description: '',
      top: false,
    },
  ]);
  const paginationProps = reactive({
    defaultPageSize: 5,
    total: dataSource.value.length,
  });

  function handleOpenProject(project: string) {
    window.open('/#/map-editor?name=' + project);
  }
  function handleUploadProject() {}
</script>

<style lang="less">
  .home-container {
    height: 100vh;
    width: 30vw;
    min-width: 500px;
    margin: 0 auto;
  }
  .home-options {
    display: flex;
    justify-content: center;
    margin-top: 50px;
    .button-wrapper {
      margin: 10px;
      button {
        width: 150px;
        height: 150px;
        border-radius: 10px;
      }
      .arco-icon {
        width: 22px;
        height: 22px;
      }
    }
  }
  .history-list {
    border: 1px solid #746c5f;
    height: 534px;
    padding: 20px;
    .history-title {
      font-size: 16px;
      font-weight: bold;
    }
    .list-item {
      border-bottom: 1px solid var(--color-fill-3);
      color: var(--color-text-2);
    }
    .top .arco-list-item-meta-title {
      color: red !important;
    }
  }
</style>
