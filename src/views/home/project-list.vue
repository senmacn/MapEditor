<template>
  <a-list
    class="project-list"
    size="small"
    :bordered="false"
    :data-source="visibleDataSourceRef"
    :pagination="paginationProps"
  >
    <template #header>
      <div class="history-search">
        <a-input v-model:value="searchValueRef" placeholder="搜索项目">
          <template #prefix>
            <search-outlined></search-outlined>
          </template>
        </a-input>
      </div>
    </template>
    <template #renderItem="{ item, index }">
      <a-list-item class="list-item" item-layout="vertical">
        <template #actions>
          <span class="options" @click.stop="handleOpenProject(item.title)">
            <folder-open-outlined />打开
          </span>
          <span class="options" @click.stop="editRef = index"> <edit-outlined />重命名</span>
          <span class="options" @click.stop="handleDownloadProject(item.title)">
            <download-outlined />
            下载
          </span>
          <!-- <span class="options">
                <heart-outlined />置顶</span> -->
          <span class="options" @click.stop="handleDeleteProject(item.title)">
            <delete-outlined />
            删除
          </span>
        </template>
        <a-tooltip title="双击打开">
          <a-list-item-meta
            :class="[item.top ? 'top' : '']"
            :description="item.description"
            @dblclick="handleOpenProject(item.title)"
          >
            <template #avatar>
              <a-avatar shape="square" :style="{ background: item.color, color: 'black' }">
                {{ item.title.slice(0, 1) }}
              </a-avatar>
            </template>
            <template #title>
              <a-input
                v-if="index === editRef"
                :default-value="item.title"
                type="text"
                @blur="(e) => handleEditProjectName(item.title, e?.target?.value)"
              />
              <span v-else>{{ item.title }}</span>
            </template>
          </a-list-item-meta>
        </a-tooltip>
      </a-list-item>
    </template>
  </a-list>
</template>

<script setup lang="ts">
  import { getLocalApi } from '@/utils/env';
  import type { LocalMapHistory } from './common/types';
  import { computed, ref } from 'vue';
  import { isObject } from '@/utils/is';
  import { exportFile } from '@/utils/file';
  import { Modal, message } from 'ant-design-vue';
  import {
    DownloadOutlined,
    EditOutlined,
    DeleteOutlined,
    FolderOpenOutlined,
    SearchOutlined,
  } from '@ant-design/icons-vue';

  const emits = defineEmits<{
    (e: 'refresh-list', showMessage: boolean): void;
  }>();

  const props = defineProps({
    dataSource: {
      type: Array as PropType<LocalMapHistory[]>,
      default: () => [],
    },
  });

  const paginationProps = computed(() => ({
    pageSize: 6,
    total: visibleDataSourceRef.value.length,
  }));
  const searchValueRef = ref('');
  const visibleDataSourceRef = computed(() => {
    if (!searchValueRef.value) {
      return props.dataSource;
    }
    return props.dataSource.filter((item) => item.title.includes(searchValueRef.value));
  });

  const localApi = getLocalApi();

  function handleOpenProject(project: string) {
    // location.href = '/#/map-editor?name=' + project;
    const url = location.href.slice().replace(/\#\/.+/, '#/map-editor?name=' + project);
    location.replace(url);
    // 刷新加载存档
    setTimeout(() => {
      location.reload();
      localApi && localApi.maximizeWindow();
    });
  }

  const editRef = ref(-1);
  function handleEditProjectName(filename: string, newname: string) {
    if (filename === newname) {
      editRef.value = -1;
      return;
    }
    localApi &&
      localApi
        .renameLocalFile(filename, newname)
        .then(() => {
          message.success('修改成功！');
        })
        .catch((err) => isObject(err) && err.showMessage && console.warn(err.showMessage))
        .finally(() => {
          editRef.value = -1;
          emits('refresh-list', true);
        });
  }
  function handleDownloadProject(filename: string) {
    Modal.confirm({
      title: '提醒',
      content: `下载${filename}?`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        localApi &&
          localApi.getLocalFileContent(filename as string).then((data) => {
            exportFile(filename, data, 'json');
          });
      },
    });
  }
  function handleDeleteProject(filename: string) {
    Modal.confirm({
      title: '提醒',
      content: `删除数据存档${filename}?`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        localApi && localApi.deleteLocalFile(filename);
        emits('refresh-list', true);
      },
    });
  }
</script>

<style lang="less">
  .project-list {
    .ant-list-header {
      border-bottom: 0 !important;
    }
    .history-search {
      padding-left: 12px;
      .ant-input-affix-wrapper {
        width: 100%;
      }
      .anticon-search {
        color: aquamarine;
      }
    }
    .list-item {
      position: relative;
      flex-direction: column;
      align-items: start;
      padding-bottom: 15px;
      border: 0 !important;
      color: @color-text-2;
      background-position: 100%;
      transition: background-position 1s;
      cursor: pointer;
      span.options {
        cursor: pointer;
      }
      &:hover {
        background: linear-gradient(
          25deg,
          rgb(120, 120, 120),
          rgb(120, 120, 120),
          rgba(0, 0, 0, 0),
          rgba(0, 0, 0, 0)
        );
        border-radius: 6px;
        background-size: 200%;
        background-position: 40% 0;
      }
    }
    .ant-avatar-string {
      font-size: 10px;
    }
    .ant-list-item-meta-avatar {
      margin-top: 8px;
    }
    .ant-list-item-meta-title {
      font-size: 14px;
    }
    .top .ant-list-item-meta-title {
      color: red !important;
    }
    .ant-list-item-meta-content {
      width: 100%;
    }
    .ant-list-item-meta-description {
      font-size: 12px;
    }
    .ant-list-item-action {
      position: absolute;
      bottom: 15px;
      top: auto;
      right: 10px;
    }
  }
</style>
