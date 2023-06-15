<template>
  <div v-if="!drawerVisibleRef" class="open-drawer" @click="drawerVisibleRef = true">
    <appstore-two-tone twoToneColor="green" />
  </div>
  <a-drawer
    class="option-drawer"
    placement="right"
    :width="400"
    :visible="drawerVisibleRef"
    :mask="false"
    @close="drawerVisibleRef = false"
  >
    <div v-if="drawerVisibleRef" class="close-drawer" @click="drawerVisibleRef = false">
      <right-outlined />
    </div>
    <div class="default-option">
      <a-row class="option-group" style="height: 380px">
        <a-col class="row-label" :span="4">
          <span class="group-label">图层： </span>
        </a-col>
        <a-col :span="24">
          <layer-list></layer-list>
        </a-col>
      </a-row>
      <area-options
        @end-edit-area="(...props) => emit('end-edit-area', props[0], props[1])"
      />
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
  import { onMounted, ref, unref } from 'vue';
  import LayerList from './children/layer-list.vue';
  import AreaOptions from './children/area-options.vue';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { loadSaves } from '@/utils/persist';
  import { useRouter } from 'vue-router';
  import { useLocalState } from '@/store/modules/local-state';
  import { message } from 'ant-design-vue';
  import { useLoading } from '@/components/Loading';
  import { getLocalApi } from '@/utils/env';
  import { RightOutlined, AppstoreTwoTone } from '@ant-design/icons-vue';

  const emit = defineEmits<{
    (e: 'end-edit-area', name: string, complete: boolean): void;
    (e: 'load-saves', layers: any): void;
  }>();

  const localState = useLocalState();
  const configRef = useEditorConfig();
  const localApi = getLocalApi();

  const drawerVisibleRef = ref(true);

  const [openLoading, closeLoading] = useLoading({ minTime: 500 });

  const { currentRoute } = useRouter();
  const { query } = unref(currentRoute.value);
  onMounted(() => {
    const { name } = query;
    if (name) {
      localState.setFileName(name as string);
      openLoading();
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
            setTimeout(() => closeLoading(), 100);
          });
    } else {
      localState.setFileName('新建项目');
    }
  });
</script>

<style lang="less">
  .option-drawer {
    position: fixed;
    width: 400px;
    max-height: 85%;
    margin: 100px 35px 20px 0;
    border-radius: 3px;
    transition: width 0.2s ease;
    .ant-drawer-content {
      overflow: visible;
      border-radius: 10px;
      background-color: rgb(51, 51, 51);
      border: 1px solid rgb(81, 81, 81);
    }
    .ant-drawer-header {
      display: none;
    }
    .ant-drawer-body {
      padding: 10px;
      &::-webkit-scrollbar {
        width: 0;
      }
    }
    .ant-drawer-content-wrapper {
      transform: translateX(150%) !important;
      overflow: hidden;
    }
    &.ant-drawer-open {
      .ant-drawer-content-wrapper {
        overflow: visible;
        transform: translateX(0) !important;
      }
    }
  }
  .default-option {
    overflow: hidden;
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
  .close-drawer {
    position: absolute;
    top: 5px;
    left: -48px;
    height: 40px;
    width: 50px;
    border-radius: 5px;
    line-height: 45px;
    border: 1px solid rgb(81, 81, 81);
    border-right: 0;
    background-color: rgb(51, 51, 51);
    z-index: 999;
    cursor: pointer;
    .anticon {
      font-size: 24px;
      color: @color-text-1;
    }
  }
  .open-drawer {
    position: fixed;
    top: 120px;
    right: 80px;
    height: 60px;
    width: 60px;
    border: 1px solid rgb(81, 81, 81);
    border-radius: 100px;
    background-color: rgb(51, 51, 51);
    z-index: 999;
    text-align: center;
    line-height: 80px;
    cursor: pointer;
    .anticon {
      font-size: 40px;
      color: @color-text-1;
    }
  }
</style>
