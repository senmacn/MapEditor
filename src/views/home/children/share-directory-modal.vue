<template>
  <a-modal
    class="share-modal"
    :width="500"
    :visible="visible"
    :closable="false"
    :onCancel="handleCancel"
    :title="null"
    :footer="null"
  >
    <div class="modal-title">共享目录</div>
    <div class="modal-content">
      <a-list item-layout="horizontal" :data-source="remoteFileListRef" :pagination="paginationProps">
        <template #renderItem="{ item }">
          <a-list-item>
            <template #actions>
              <a-button type="primary" @click="download(item.name)">下载</a-button>
              <a-button @click="deleteRemoteFile(item.name)">删除</a-button>
            </template>
            <a-list-item-meta :description="item.update_time">
              <template #title>
                {{ item.name }}
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </div>
    <div class="ant-modal-footer">
      <a-button @click="handleCancel">关闭</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import { getLocalApi } from '@/utils/env';
  import { Modal, message } from 'ant-design-vue';
  import { computed, ref, watch } from 'vue';

  const emits = defineEmits<{
    (e: 'close'): void;
    (e: 'success'): void;
  }>();

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false,
    },
  });

  const localApi = getLocalApi();
  const remoteFileListRef = ref<Recordable<string>[]>([]);
  watch(
    () => props.visible,
    async () => {
      if (props.visible) {
        const list = await localApi?.getRemoteFiles();
        if (Array.isArray(list)) {
          remoteFileListRef.value = list;
        }
      }
    },
  );

  const paginationProps = computed(() => ({
    pageSize: 8,
    total: remoteFileListRef.value.length,
  }));

  function download(name: string) {
    if (localApi) {
      Modal.confirm({
        title: '提醒',
        content: `确认下载【${name}】到本地目录？文件将被重命名为【共享_${name}】`,
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          if (localApi) {
            try {
              await localApi.downloadRemoteFile(name);
              message.success('下载成功！');
              emits('success');
            } catch (e) {
              message.error('下载失败！请检查网络连接、远程url地址，或者联系开发人员！');
            }
          }
        },
      });
    }
  }

  function deleteRemoteFile(name: string) {
    if (localApi) {
      Modal.confirm({
        title: '提醒',
        content: `确认删除共享文件【${name}】？删除操作无法恢复！`,
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          if (localApi) {
            try {
              await localApi.deleteRemoteFile(name);
              message.success('删除成功！');
              emits('close');
            } catch (e) {
              message.error('删除失败！请检查网络连接、远程url地址，或者联系开发人员！');
            }
          }
        },
      });
    }
  }

  function handleCancel() {
    emits('close');
  }
</script>

<style lang="less">
  .share-modal {
    &.ant-modal {
      top: 20%;
    }
    .ant-modal-footer {
    }
  }
</style>
