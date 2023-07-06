<template>
  <a-modal
    class="share-link-modal"
    :width="500"
    :visible="visible"
    :closable="false"
    :onCancel="handleCancel"
    :title="null"
    :footer="null"
  >
    <div class="modal-title">链接分享</div>
    <div class="modal-content">
      <div class="warning-color">
        <info-circle-outlined class="warning-color" />
        分享链接前，请保存文件，否则可能分享错误的文件版本！
      </div>
      <div class="link-create">
        <a-input :value="linkRef">
          <template #addonBefore>
            <link-outlined></link-outlined>
            链接
          </template>
        </a-input>
      </div>
    </div>
    <div class="confirm-button-group">
      <a-button type="primary" @click="handleCreateShareLink">生成链接</a-button>
      <a-button type="primary" @click="handleCopyShareLink" :disabled="!linkRef">
        复制链接
      </a-button>
      <a-button @click="handleCancel">关闭</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
  import { getLocalApi } from '@/utils/env';
  import { useLocalState } from '@/store/modules/local-state';
  import { message } from 'ant-design-vue';
  import { ref, watch } from 'vue';
  import { useLoading } from '@/components/Loading';
  import { InfoCircleOutlined, LinkOutlined } from '@ant-design/icons-vue';
  import { isObject } from '@/utils/is';

  const emits = defineEmits<{
    (e: 'close'): void;
  }>();

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false,
    },
    uuid: {
      type: String,
      default: '',
    },
  });

  const [open, close] = useLoading({ tip: '分享链接生成中！', minTime: 300 });

  const localApi = getLocalApi();
  const localState = useLocalState();

  const linkRef = ref('');
  function handleCreateShareLink() {
    open();
    localApi
      ?.createShareLink(localState.getFileName, props.uuid)
      .then((data) => {
        if (isObject(data)) {
          message.error('生成失败！' + data.showMessage);
        } else {
          linkRef.value = data as string;
        }
      })
      .catch((err) => {
        message.error('生成失败！' + err.message);
      })
      .finally(() => {
        close();
      });
  }

  const { clipboardRef } = useCopyToClipboard();
  function handleCopyShareLink() {
    clipboardRef.value = linkRef.value;
    message.success('分享链接已复制！');
  }

  function handleCancel() {
    emits('close');
  }

  watch(
    () => props.uuid,
    () => {
      linkRef.value = '';
    },
  );
</script>

<style lang="less">
  .share-link-modal {
    &.ant-modal {
      top: 20%;
    }
    .link-create {
      margin-top: 20px;
    }
    .confirm-button-group {
      width: 75%;
    }
  }
</style>
