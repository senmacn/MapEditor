<template>
  <a-modal
    class="project-size-config-modal"
    :width="600"
    :visible="visible"
    @cancel="emit('close')"
    @ok="handleChange"
    :closable="false"
  >
    <div class="modal-title">项目设置</div>
    <div class="modal-content">
      <a-divider>基础设置</a-divider>
      <div class="map-size">
        <span class="necessary">项目名称</span>
        <a-input v-model:value="baseConfigRef.name"></a-input>
      </div>
      <div class="map-config">
        <a-divider>地图设置</a-divider>
        <div class="map-size">
          <span>地图Sn</span>
          <a-input v-model:value="projectConfigRef.Sn"></a-input>
        </div>
        <div class="map-size">
          <span class="necessary">3d地图起始点X坐标</span>
          <a-input v-model:value="projectConfigRef.startPointX"></a-input>
        </div>
        <div class="map-size">
          <span class="necessary">3d地图起始点Y坐标</span>
          <a-input v-model:value="projectConfigRef.startPointY"></a-input>
        </div>
        <div class="map-size">
          <span class="necessary">3d地图长度</span>
          <a-input v-model:value="projectConfigRef.mapWidth"></a-input>
        </div>
        <div class="map-size">
          <span class="necessary">3d地图宽度</span>
          <a-input v-model:value="projectConfigRef.mapHeight"></a-input>
        </div>
        <div class="map-size">
          <a-tooltip title="一张纹理所对应3d世界边长">
            <span class="necessary">
              截屏Actor宽度
              <info-circle-outlined class="warning-color" />
            </span>
          </a-tooltip>
          <a-input v-model:value="projectConfigRef.actorWidth"></a-input>
        </div>
        <div class="map-size">
          <span class="necessary">截屏Actor生成纹理宽度</span>
          <a-input v-model:value="projectConfigRef.actorPxWidth"></a-input>
        </div>
      </div>
      <div class="backend-config">
        <a-divider>项目底图设置</a-divider>
        <div class="map-size">
          <span class="necessary">底图起始点位置(左上角)X坐标</span>
          <a-input v-model:value="projectConfigRef.offsetX"></a-input>
        </div>
        <div class="map-size">
          <span class="necessary">底图起始点位置(左上角)Y坐标</span>
          <a-input v-model:value="projectConfigRef.offsetY"></a-input>
        </div>
        <div class="map-size">
          <span class="necessary">底图长度(水平方向)</span>
          <a-input v-model:value="projectConfigRef.offsetWidth"></a-input>
        </div>
        <div class="map-size">
          <span class="necessary">底图宽度(垂直方向)</span>
          <a-input v-model:value="projectConfigRef.offsetHeight"></a-input>
        </div>
      </div>
    </div>
    <div class="remind">
      <span class="error-color">修改地图尺寸会刷新页面！ </span>
      数据将被自动保存！
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import { Ref, ref, toRaw, watch } from 'vue';
  import modal from 'ant-design-vue/lib/modal';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { isNumber } from '@/utils/is';
  import { message } from 'ant-design-vue';
  import { getLocalApi } from '@/utils/env';
  import { InfoCircleOutlined } from '@ant-design/icons-vue';
  import { useLocalState } from '@/store/modules/local-state';
  import useDriver from '@/hooks/useDriver';

  const emit = defineEmits<{
    (e: 'change-size'): void;
    (e: 'close'): void;
  }>();

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false,
    },
  });

  const configRef = useEditorConfig();
  const localState = useLocalState();

  const baseConfigRef = ref({
    name: '',
  });
  const projectConfigRef: Ref<ProjectSizeConfig> = ref({
    Sn: '',
    startPointX: 0,
    startPointY: 0,
    mapWidth: 100800,
    mapHeight: 100800,
    actorWidth: 25200,
    actorPxWidth: 1024,
    offsetX: 0,
    offsetY: 0,
    offsetWidth: 25200,
    offsetHeight: 25200,
  });

  watch(
    () => props.visible,
    () => {
      if (props.visible) {
        if (configRef.getProjectSizeConfig) {
          projectConfigRef.value = Object.assign({}, configRef.getProjectSizeConfig);
        }
        const filename = toRaw(localState.filename).replace('.json', '');
        baseConfigRef.value.name = filename;
      }
    },
    {
      immediate: true,
    },
  );

  function handleChange() {
    const sizeObj = {
      ...toRaw(projectConfigRef.value),
    };
    for (const key of Object.keys(sizeObj)) {
      const element = Number(sizeObj[key]);
      if (!isNumber(element)) {
        message.warning('编辑器数据参数未填写完成！');
        return;
      }
    }
    modal.confirm({
      title: '提醒',
      content: '修改设置将刷新页面！数据会被自动保存！',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        localState.setFileName(baseConfigRef.value.name + '.json');
        configRef.setProjectSizeConfig(sizeObj);

        // 自动保存数据
        const localApi = getLocalApi();
        if (localApi) {
          localApi.setUserConfig({
            projectSizeConfig: sizeObj,
          } as any as UserConfig);
        }
        emit('change-size');
      },
    });
  }

  useDriver('project-size-config-modal', [
    {
      element: '.map-config',
      popover: {
        title: '地图设置设置',
        description: '从2D地图Excel表中查找对应的数据填入！',
        align: 'start',
      },
    },
    {
      element: '.backend-config',
      popover: {
        popoverClass: 'backend-config-popover',
        title: '底图设置',
        description: `根据想要画的底图的大小填充数据<br>
          例: 想要导入完整地图中的3-2和3-3这两张图进行绘制<br>
          这两张图的起始位置(左上角)的XY坐标为3-2的左上角XY坐标<br>
          3-2水平方向左侧有三张图(3-0, 3-1, 3-2)，使用[截屏Actor宽度] * 3 得到X坐标<br>
          3-2垂直方向上侧有两张图(0-2, 1-2)，使用[截屏Actor宽度] * 2 得到Y坐标<br>
          3-2和3-3这两张图水平方向长[截屏Actor宽度]* 2，垂直方向宽[截屏Actor宽度]* 1
          `,
        align: 'start',
        side: 'left',
      },
    },
  ]);
</script>

<style lang="less">
  .project-size-config-modal {
    .map-size {
      display: flex;
      margin-bottom: 12px;
      justify-content: center;
      > span:first-child {
        width: 160px;
        text-align: left;
      }
      .ant-input,
      .ant-input-affix-wrapper {
        width: 280px;
      }
      .necessary::before {
        content: '*';
        color: #ff502c;
        font-size: 14px;
      }
    }
    .remind {
      text-align: center;
      color: @warning-color;
    }
  }
  .backend-config-popover {
    max-width: 600px !important;
  }
</style>
