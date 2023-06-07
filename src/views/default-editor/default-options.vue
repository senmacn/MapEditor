<template>
  <div class="default-option">
    <file-options @load-saves="(...props) => emit('load-saves', props[0])" />
    <a-row class="option-group" style="height: 250px">
      <a-col class="row-label" :span="4">
        <span class="group-label">图层： </span>
      </a-col>
      <a-col :span="24">
        <layer-list></layer-list>
      </a-col>
    </a-row>
    <area-options
      style="height: 140px"
      @end-edit-area="(...props) => emit('end-edit-area', props[0], props[1])"
    />
    <edit-options></edit-options>
    <edit-config></edit-config>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, unref } from 'vue';
  import LayerList from './children/layer-list.vue';
  import FileOptions from './children/file-options.vue';
  import AreaOptions from './children/area-options.vue';
  import EditOptions from './children/edit-options.vue';
  import EditConfig from './children/edit-config.vue';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { loadSaves } from '@/utils/persist';
  import { useRouter } from 'vue-router';
  import { useLocalState } from '@/store/modules/local-state';
  import { message } from 'ant-design-vue';
  import { useLoading } from '@/components/Loading';
  import { getLocalApi } from '@/utils/env';

  const emit = defineEmits<{
    (e: 'end-edit-area', name: string, complete: boolean): void;
    (e: 'load-saves', layers: any): void;
  }>();

  const localState = useLocalState();
  const configRef = useEditorConfig();
  const localApi = getLocalApi();

  const [openLoadLoading, closeLoadLoading] = useLoading({ tip: '加载中！', minTime: 2000 });

  const { currentRoute } = useRouter();
  const { query } = unref(currentRoute.value);
  onMounted(() => {
    const { name } = query;
    if (name) {
      localState.setFileName(name as string);
      openLoadLoading();

      localApi &&
        localApi
          .getLocalFileContent(name as string)
          .then((data) => {
            try {
              const result = loadSaves(data, [configRef.getSize.x, configRef.getSize.y]);
              emit('load-saves', result?.layers);
            } catch (e: any) {
              message.warning({
                content: e.message,
                duration: 60000,
              });
            }
          })
          .finally(() => {
            closeLoadLoading();
          });
    } else {
      localState.setFileName('新建项目');
    }
  });
</script>

<style lang="less">
  .default-option {
    color: #d4d4d4;
    .ant-upload-wrapper {
      width: auto;
    }
    .ant-select {
      width: 90px;
      height: 38px;
    }
    .ant-row {
      align-items: center;
      margin: 10px;
      .ant-col {
        margin-bottom: 6px;
        font-size: 12px;
      }
      .row-label {
        font-weight: bold;
        font-size: 14px;
      }
      .ant-btn-group {
        .pcr-button {
          height: 32px;
          width: 32px;
          margin-left: 1px;
        }
      }
      .ant-input-number {
        width: 80px;
      }
    }
    .pickr-wrapper {
      display: flex;
      align-items: center;
    }
    .ant-btn.actived {
      color: @color-text-2;
      background-color: @color-bg-1;
      border-color: transparent;
    }
    .option-group {
      border-bottom: 1px solid @color-border-1;
    }
    .ant-btn {
      font-size: 12px;
      width: 80px;
      height: 32px;
    }
    .ant-input-wrapper {
      background-color: transparent;
      border-color: @color-fill-3;
    }
  }
  .result {
    margin-top: 400px;
    margin-left: 200px;
  }
</style>
