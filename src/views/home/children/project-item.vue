<template>
  <a-list-item :class="['list-item', item.property.star && 'star-item']" item-layout="vertical">
    <template #actions>
      <span class="options" v-if="!item.property.star" @click.stop="handleStarItem(true)"> <star-outlined />置顶 </span>
      <span class="options" v-else @click.stop="handleStarItem(false)"> <star-filled />取消置顶 </span>
      <span class="options" @click.stop="editRef = true"> <edit-outlined />重命名</span>
      <span class="options" @click.stop="handleDownloadProject(item.title)">
        <download-outlined />
        下载
      </span>
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
          <a-avatar shape="square" :style="{ background: item.property.color, color: 'black' }">
            {{ item.title.slice(0, 1) }}
          </a-avatar>
        </template>
        <template #title>
          <a-input
            v-if="editRef"
            :default-value="item.title"
            type="text"
            @blur="(e: any) => handleEditProjectName(item.title, e?.target?.value)"
          />
          <span v-else>{{ item.title }}</span>
        </template>
      </a-list-item-meta>
    </a-tooltip>
  </a-list-item>
</template>

<script setup lang="ts">
  import type { LocalMapHistory } from '../common/types';
  import { getLocalApi } from '@/utils/env';
  import { ref } from 'vue';
  import { exportFile } from '@/utils/file';
  import { message, Modal } from 'ant-design-vue';
  import { isObject } from 'lodash-es';
  import { StarOutlined, StarFilled, DownloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue';

  const emits = defineEmits<{
    (e: 'refresh-list', silence: boolean): void;
  }>();

  const props = defineProps({
    item: {
      type: Object as PropType<LocalMapHistory>,
      default: () => ({} as LocalMapHistory),
    },
  });
  const localApi = getLocalApi();

  function handleOpenProject(project: string) {
    // location.href = '/#/map-editor?name=' + project;
    const url = location.href.slice().replace(/#\/.+/, '#/map-editor?name=' + project);
    location.replace(url);
    // 刷新加载存档
    setTimeout(() => {
      location.reload();
      localApi && localApi.maximizeWindow();
    });
  }

  async function handleStarItem(star: boolean) {
    if (localApi) {
      await localApi.starItem(props.item.title, star);
      emits('refresh-list', true);
    }
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
    &.star-item {
      border-radius: 6px;
      background: #5e5e5e;
      .ant-list-item-action li:first-child {
        visibility: visible;
      }
    }
    &:hover {
      background: linear-gradient(270deg, rgb(120, 120, 120), rgb(120, 120, 120), rgba(0, 0, 0, 0), rgba(0, 0, 0, 0));
      border-radius: 6px;
      background-size: 300%;
      background-position: 100%;
      animation: grow 0.8s linear;
      .ant-list-item-action {
        visibility: visible;
      }
    }
    @keyframes grow {
      0% {
        background-position: 150%;
      }
      100% {
        background-position: 100%;
      }
    }

    span.options {
      font-size: 12px;
      cursor: pointer;
      &:hover {
        color: @color-text-1;
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
      bottom: 10px;
      top: auto;
      right: 10px;
    }
    .ant-list-item-action-split {
      visibility: hidden;
    }
  }
</style>
