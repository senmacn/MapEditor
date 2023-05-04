<template>
  <div class="default-option">
    <a-row class="option-group" style="height: 100px">
      <a-col class="row-label" :span="4">
        <span class="group-label">文件： </span>
      </a-col>
      <a-col :span="6">
        <a-button type="primary" @click="handleChangeMapSize">设置地图尺寸</a-button>
      </a-col>
      <a-col :span="6">
        <a-button type="primary" @click="getPosition">下载坐标</a-button>
      </a-col>
      <a-col :span="6" :offset="4">
        <a-button type="primary" :disable="!isLocal()" @click="handleCreateSaves"> 保存 </a-button>
      </a-col>
      <a-col :span="6">
        <a-button type="primary" @click="handleExportSaves"> 导出 </a-button>
      </a-col>
      <a-col :span="6">
        <a-upload @beforeUpload="(file) => handleLoadSaves(file)" accept=".json">
          <template #upload-button>
            <a-button type="primary">加载</a-button>
          </template>
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
  import { Ref, inject, onMounted, ref, toRaw, unref } from 'vue';
  import modal from '@arco-design/web-vue/es/modal';
  import LayerList from './components/layer-list.vue';
  import AreaOptions from './components/area-options.vue';
  import EditOptions from './components/edit-options.vue';
  import EditConfig from './components/edit-config.vue';
  import ChangeMapSizeModal from './components/change-map-size-modal.vue';
  import { Layer } from './common/types';
  import { useLoading } from '../../components/Loading';
  import { exportFile } from '../../utils/file';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { dataToBin } from './common/quadtree-utils';
  import { getClosedCurvePointsData } from './common/image-data-util';
  import { createSaves } from '@/utils/persist';
  import { loadSaves } from '@/utils/persist';
  import message from '@arco-design/web-vue/es/message';
  import { getFormatDate } from '@/utils/date';
  import { useRouter } from 'vue-router';
  import { useLocalState } from '@/store/modules/local-state';
  import { getLocalApi, isLocal } from '@/utils/env';

  const emit = defineEmits<{
    (e: 'end-edit-area', name: string, complete: boolean): void;
    (e: 'load-saves', layers: any): void;
  }>();

  const localState = useLocalState();
  const configRef = useEditorConfig();
  const layersRef: Ref<Layer[]> = inject('layers', [] as any);

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
          getLocalApi().saveLocalFile(
            fileName,
            createSaves([configRef.getSize.x, configRef.getSize.y], toRaw(layersRef.value)),
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
      content: '导出当前编辑的数据存档？',
      onOk: () => {
        exportFile(
          `map_data_${configRef.getSize.x}x${configRef.getSize.y}.${getFormatDate(
            new Date(),
            'MM-dd_hh-mm',
          )}.json`,
          createSaves([configRef.getSize.x, configRef.getSize.y], toRaw(layersRef.value)),
          'json',
        );
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
      message.warning(e.message);
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
                  const boundRect = toRaw(area.getBoundRect());
                  exportFile(
                    area.getName() + '.data.bin',
                    dataToBin(data, boundRect[0], boundRect[1], boundRect[2], boundRect[3]),
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

      getLocalApi()
        .getLocalFileContent(name as string)
        .then((data) => {
          _handleExecutionSave(data);
        })
        .finally(() => {
          closeLoadLoading();
        });
    }
  });
</script>

<style lang="less">
  .default-option {
    color: #d4d4d4;
    .arco-upload-wrapper {
      width: auto;
    }
    .arco-select {
      width: 90px;
      height: 38px;
    }
    .arco-row {
      align-items: center;
      margin: 10px;
      .arco-col {
        margin-bottom: 6px;
        font-size: 12px;
      }
      .row-label {
        font-weight: bold;
        font-size: 14px;
      }
      .arco-btn-group {
        .pcr-button {
          height: 32px;
          width: 32px;
          margin-left: 1px;
        }
      }
      .arco-input-number {
        width: 100px;
      }
    }
    .pickr-wrapper {
      display: flex;
      align-items: center;
    }
    .arco-btn.actived {
      color: var(--color-text-2);
      background-color: var(--color-secondary-active);
      border-color: transparent;
    }
    .option-group {
      border-bottom: 1px solid var(--color-border-2);
    }
    .arco-btn {
      font-size: 12px;
      width: 80px;
      height: 32px;
    }
    .arco-input-wrapper {
      background-color: transparent;
      border-color: var(--color-fill-3);
    }
  }
  .result {
    margin-top: 400px;
    margin-left: 200px;
  }
</style>
