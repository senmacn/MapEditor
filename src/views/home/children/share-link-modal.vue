<template>
  <a-modal
    class="link-modal"
    :width="500"
    :visible="visible"
    :closable="false"
    :onCancel="handleCancel"
    :title="null"
    :footer="null"
  >
    <div class="modal-title">请输入链接</div>
    <div class="modal-content">
      <div class="link-create">
        <a-input v-model:value="linkRef">
          <template #addonBefore>
            <link-outlined></link-outlined>
          </template>
        </a-input>
      </div>
    </div>
    <div class="ant-modal-footer">
      <a-button @click="handleCancel">关闭</a-button>
      <a-button type="primary" @click="handleOpenShareLink" :disable="!linkRef">打开</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import { getLocalApi } from '@/utils/env';
  import { message } from 'ant-design-vue';
  import { ref } from 'vue';
  import { useLoading } from '@/components/Loading';
  import { LinkOutlined } from '@ant-design/icons-vue';

  const emits = defineEmits<{
    (e: 'close'): void;
  }>();

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false,
    },
  });

  const [open, close] = useLoading({ tip: '链接解析中！', minTime: 300 });

  const localApi = getLocalApi();

  const linkRef = ref('');
  async function handleOpenShareLink() {
    open();
    try {
      if (!localApi) return;
      const result = await localApi.executeShareLink(linkRef.value);
      if (result.showMessage) throw new Error(result.showMessage);
      const { name, uuid } = result as Recordable;
      const url = location.href
        .slice()
        .replace(/\#\/.+/, '#/map-editor?name=' + name + '&uuid=' + uuid);
      location.replace(url);
      // 刷新加载存档
      setTimeout(() => {
        location.reload();
        localApi && localApi.maximizeWindow();
      });
    } catch (err) {
      message.warning('解析分享链接失败！');
    }
    close();
  }

  function handleCancel() {
    emits('close');
  }
</script>

<style lang="less">
  .link-modal {
    &.ant-modal {
      top: 20%;
    }
    .link-create {
      margin-top: 20px;
    }
    .ant-modal-footer {
      width: 75%;
    }
  }
</style>
