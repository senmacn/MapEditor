<template>
  <a-list-item class="list-item" item-layout="vertical">
    <template #actions>
      <span class="options" @click.stop="editRef = true"> <edit-outlined />重命名</span>
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
            v-if="editRef"
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

<script setup lang="ts">
  import { getLocalApi } from '@/utils/env';
  import { LocalMapHistory } from '../common/types';
  import { ref } from 'vue';
  import { exportFile } from '@/utils/file';
  import { message, Modal } from 'ant-design-vue';
  import { isObject } from 'lodash-es';

  const emits = defineEmits<{
    (e: 'refresh-list', showMessage: boolean): void;
  }>();

  defineProps({
    item: {
      type: Object as PropType<LocalMapHistory>,
      default: () => ({} as LocalMapHistory),
    },
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

  const editRef = ref(false);
  function handleEditProjectName(filename: string, newname: string) {
    if (filename === newname) {
      editRef.value = false;
      return;
    }
    localApi &&
      localApi
        .renameLocalFile(filename, newname)
        .then(() => {
          message.success('修改成功！');
        })
        // @ts-ignore
        .catch((err: any) => isObject(err) && err.showMessage && console.warn(err.showMessage))
        .finally(() => {
          editRef.value = false;
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
  .ant-list-item.list-item {
    position: relative;
    flex-direction: column;
    align-items: start;
    padding-bottom: 15px;
    border: 0 !important;
    color: @color-text-2;
    cursor: pointer;
    span.options {
      font-size: 12px;
      cursor: pointer;
      &:hover {
        color: @color-text-1;
      }
    }
    &:hover {
      background: linear-gradient(
        90deg,
        rgb(120, 120, 120),
        rgb(120, 120, 120),
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0)
      );
      border-radius: 6px;
      background-size: 200%;
      animation: grow 1.5s linear infinite;
      .ant-list-item-action {
        visibility: visible;
      }
    }
    @keyframes grow {
      0% {
        background-position: 0%;
      }
      100% {
        background-position: 200%;
      }
    }

    .ant-avatar-string {
      font-size: 10px;
    }
    .ant-list-item-meta-avatar {
      margin-top: 8px;
    }
    .ant-list-item-meta {
      min-width: 60%;
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
      visibility: hidden;
      bottom: 15px;
      top: auto;
      right: 10px;
    }
    .ant-list-item-action-split {
      visibility: hidden;
    }
  }
</style>
