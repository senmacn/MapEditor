<template>
  <a-modal
    class="change-layer-modal"
    :width="600"
    :visible="visible"
    :closable="false"
    :footer="null"
  >
    <div class="modal-title">历史版本</div>
    <div class="modal-content">
      <a-list item-layout="horizontal" :data-source="dataSource">
        <template #renderItem="{ item }">
          <a-list-item>
            <template #actions>
              <a @click="handleReviewHistory(item.name)">预览</a>
              <a @click="handleUseHistory(item.name)">使用该版本</a>
            </template>
            <a-skeleton avatar :title="false" :loading="!!item.loading" active>
              <a-list-item-meta :description="item.time">
                <template #title>
                  {{ item.name }}
                </template>
              </a-list-item-meta>
            </a-skeleton>
          </a-list-item>
        </template>
      </a-list>
    </div>
    <div class="ant-modal-footer">
      <a-button @click="handleClose">关闭</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import { useLocalState } from '@/store/modules/local-state';
  import { getLocalApi, isLocal } from '@/utils/env';
  import { isArray } from '@/utils/is';
  import { ref, watch } from 'vue';
  import { useLoading } from '@/components/Loading';
  import { Modal } from 'ant-design-vue';
  import moment from 'moment';

  const emits = defineEmits<{
    (e: 'close'): void;
  }>();

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false,
    },
  });

  const localApi = getLocalApi();
  const localState = useLocalState();

  const dataSource = ref<Recordable[]>([]);
  function refreshHistory() {
    localApi?.getLocalHistoryList(localState.getFileName).then((data: string[]) => {
      if (isArray(data)) {
        const record: Recordable[] = [];
        for (let index = 0; index < data.length; index++) {
          const element = data[index];
          const date = element.split('_').slice(0, 2);
          const dateStr = date[0] + ' ' + date[1].replaceAll('-', ':');
          const fDate = moment(dateStr);
          record.push({
            name: element,
            moment: fDate,
            time: fDate.format('YYYY-MM-DD HH:mm:ss'),
          });
        }
        record.sort((v, j) => v.moment.isAfter(j.moment) ? -1 : 1);
        dataSource.value = record;
      }
    });
  }
  watch(
    () => props.visible,
    () => {
      if (props.visible) {
        refreshHistory();
      }
    },
  );

  function handleReviewHistory(historyName) {
    let url = location.href.slice().replace(/\#\/.+/, '#/map-editor?name=');
    url += localState.filename + '&history=' + historyName;
    isLocal() ? localApi?.newWindow(url) : window.open(url);
  }

  const [openLoading, closeLoading] = useLoading({ size: 32 });
  function handleUseHistory(name: string) {
    Modal.confirm({
      title: '使用历史数据',
      content: '使用历史数据将覆盖当前绘制数据，请确认已在预览中查看数据！',
      type: 'warning',
      okText: '确定使用',
      cancelText: '取消',
      onOk: async () => {
        openLoading();
        await localApi?.useLocalFileHistory(name);
        setTimeout(() => {
          closeLoading();
          location.reload();
        });
      },
    });
  }

  function handleClose() {
    emits('close');
  }
</script>

<style lang="less">
  .change-layer-modal {
    .modal-content {
      padding: 36px 56px 56px;
      .title {
        font-weight: bold;
        font-size: 14px;
      }
    }
  }
</style>
