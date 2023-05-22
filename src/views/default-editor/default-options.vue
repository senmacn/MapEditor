<template>
  <div class="default-option">
    <a-row class="option-group" style="height: 100px">
      <a-col class="row-label" :span="4">
        <span class="group-label">文件： </span>
      </a-col>
      <a-col :span="6">
        <a-button type="primary" @click="handleChangeMapSize">尺寸设置</a-button>
      </a-col>
      <a-col :span="6">
        <a-button type="primary" @click="getPosition">下载坐标</a-button>
      </a-col>
      <a-col :span="6" :offset="4">
        <a-button type="primary" :disabled="!isLocal()" @click="handleCreateSaves"> 保存 </a-button>
      </a-col>
      <a-col :span="6">
        <a-button type="primary" @click="handleExportSaves"> 导出 </a-button>
      </a-col>
      <a-col :span="6">
        <a-upload
          @beforeUpload="(file) => handleLoadSaves(file)"
          accept=".json"
          :showUploadList="false"
        >
          <a-button type="primary">加载</a-button>
        </a-upload>
      </a-col>
    </a-row>
    <a-row class="option-group" style="height: 250px">
      <a-col class="row-label" :span="4">
        <span class="group-label">图层： </span>
      </a-col>
      <a-col :span="24">
        <layer-list></layer-list>
      </a-col>
    </a-row>
    <area-options
      style="height: 100px"
      @end-edit-area="(...props) => emit('end-edit-area', props[0], props[1])"
    />
    <edit-options></edit-options>
    <edit-config></edit-config>
  </div>
  <change-map-size-modal
    :visible="changeMapSizeModalVisible"
    @close="changeMapSizeModalVisible = false"
  ></change-map-size-modal>
</template>

<script setup lang="ts">
  import { Ref, inject, onMounted, ref, unref } from 'vue';
  import modal from 'ant-design-vue/lib/modal';
  import LayerList from './children/layer-list.vue';
  import AreaOptions from './children/area-options.vue';
  import EditOptions from './children/edit-options.vue';
  import EditConfig from './children/edit-config.vue';
  import ChangeMapSizeModal from './children/change-map-size-modal.vue';
  import { Layer } from './common/types';
  import { useLoading } from '@/components/Loading';
  import { exportFile } from '../../utils/file';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { dataToBin } from './utils/quadtree-utils';
  import { getClosedCurvePointsData } from './utils/image-data-util';
  import { createSaves } from '@/utils/persist';
  import { loadSaves } from '@/utils/persist';
  import { getFormatDate } from '@/utils/date';
  import { useRouter } from 'vue-router';
  import { useLocalState } from '@/store/modules/local-state';
  import { getLocalApi, isLocal } from '@/utils/env';
  import { message } from 'ant-design-vue';

  const emit = defineEmits<{
    (e: 'end-edit-area', name: string, complete: boolean): void;
    (e: 'load-saves', layers: any): void;
  }>();

  const localState = useLocalState();
  const configRef = useEditorConfig();
  const layersRef: Ref<Layer[]> = inject('layers', [] as any);

  const localApi = getLocalApi();
  function handleCreateSaves() {
    modal.confirm({
      title: '确认',
      content: '保存当前编辑的数据存档？',
      onOk: () => {
        try {
          const fileName =
            localState.getFileName ||
            `map_data_${configRef.getSize.x}x${configRef.getSize.y}.${getFormatDate(
              new Date(),
              'MM-dd_hh-mm',
            )}.json`;
          localApi &&
            localApi.saveLocalFile(
              fileName,
              createSaves([configRef.getSize.x, configRef.getSize.y], layersRef.value),
            );
          localState.setFileName(fileName);
        } catch (_err) {
          console.warn(_err);
        }
      },
    });
  }
  function handleExportSaves() {
    modal.confirm({
      title: '确认',
      type: 'confirm',
      content: '导出当前编辑的数据存档？',
      onOk: () => {
        openLoadLoading();
        exportFile(
          `map_data_${configRef.getSize.x}x${configRef.getSize.y}.${getFormatDate(
            new Date(),
            'MM-dd_hh-mm',
          )}.json`,
          createSaves([configRef.getSize.x, configRef.getSize.y], layersRef.value),
          'json',
        );
        setTimeout(() => closeLoadLoading(), 300);
      },
    });
  }

  const [openLoadLoading, closeLoadLoading] = useLoading({ tip: '加载中！', minTime: 2000 });
  function handleLoadSaves(file: File) {
    openLoadLoading();
    var reader = new FileReader(); //调用FileReader
    reader.readAsText(file); //将文件读取为 text
    reader.onload = function (evt) {
      _handleExecutionSave(String(evt.target?.result));
      closeLoadLoading();
    };
    return Promise.reject() as any;
  }
  function _handleExecutionSave(data) {
    try {
      const result = loadSaves(data, [configRef.getSize.x, configRef.getSize.y]);
      emit('load-saves', result?.layers);
    } catch (e: any) {
      message.warning({
        content: e.message,
        duration: 60000,
      });
    }
  }

  const [openLoading, closeLoading] = useLoading({ tip: '计算中！', minTime: 1500 });
  function getPosition() {
    modal.confirm({
      title: '确认',
      content: '下载当前显示图层的坐标数据',
      onOk: () => {
        const layers = unref(layersRef);
        new Promise((resolve) => {
          openLoading();
          setTimeout(() => {
            for (let index = layers.length - 1; index >= 0; index--) {
              const layer = layers[index];
              if (layer.visible && layer.hot) {
                layer.areas.forEach((area) => {
                  const data = getClosedCurvePointsData(area);
                  // TODO: 测试getClosedCurvePointsData函数 TEST START
                  // const mask = document.getElementById('mask-canvas') as HTMLCanvasElement;
                  // mask.style.display = 'block';
                  // const ctx = mask.getContext('2d', {
                  //   willReadFrequently: true,
                  // }) as CanvasRenderingContext2D;
                  // ctx.putImageData(data, 0, 0);
                  // TEST END
                  const boundRect = area.getBoundRect();
                  exportFile(
                    area.getName() + '.data.bin',
                    dataToBin(
                      data,
                      boundRect[0],
                      boundRect[1],
                      boundRect[2],
                      boundRect[3],
                      configRef.getSize.x,
                      configRef.getSize.y,
                    ),
                  );
                });
              }
            }
            resolve(true);
          }, 10);
        }).finally(() => closeLoading());
      },
    });
  }

  const changeMapSizeModalVisible = ref(false);
  function handleChangeMapSize() {
    changeMapSizeModalVisible.value = true;
  }

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
            _handleExecutionSave(data);
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
