<template>
  <a-modal
    class="project-size-config-modal"
    :width="600"
    :visible="visible"
    @cancel="emit('close')"
    @ok="handleChange"
    :closable="false"
  >
    <div class="modal-title">尺寸设置</div>
    <div class="modal-content">
      <a-divider>地图设置</a-divider>
      <div class="map-size">
        <span>地图Sn</span>
        <a-input v-model:value="projectConfigRef.Sn"></a-input>
      </div>
      <div class="map-size">
        <span>3d地图起始点X坐标</span>
        <a-input v-model:value="projectConfigRef.startPointX"></a-input>
      </div>
      <div class="map-size">
        <span>3d地图起始点Y坐标</span>
        <a-input v-model:value="projectConfigRef.startPointY"></a-input>
      </div>
      <div class="map-size">
        <span>3d地图长度</span>
        <a-input v-model:value="projectConfigRef.mapWidth"></a-input>
      </div>
      <div class="map-size">
        <span>3d地图宽度</span>
        <a-input v-model:value="projectConfigRef.mapHeight"></a-input>
      </div>
      <div class="map-size">
        <a-tooltip title="一张纹理所对应3d世界边长">
          <span>
            截屏Actor宽度
            <info-circle-outlined class="warning-color" />
          </span>
        </a-tooltip>
        <a-input v-model:value="projectConfigRef.actorWidth"></a-input>
      </div>
      <div class="map-size">
        <span>截屏Actor生成纹理宽度</span>
        <a-input v-model:value="projectConfigRef.actorPxWidth"></a-input>
      </div>
      <a-divider>项目底图设置</a-divider>
      <div class="map-size">
        <span>项目底图起始点位置X坐标</span>
        <a-input v-model:value="projectConfigRef.offsetX"></a-input>
      </div>
      <div class="map-size">
        <span>项目底图起始点位置Y坐标</span>
        <a-input v-model:value="projectConfigRef.offsetY"></a-input>
      </div>
      <div class="map-size">
        <span>项目长度</span>
        <a-input v-model:value="projectConfigRef.offsetWidth"></a-input>
      </div>
      <div class="map-size">
        <span>项目宽度</span>
        <a-input v-model:value="projectConfigRef.offsetHeight"></a-input>
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

  const projectConfigRef: Ref<ProjectSizeConfig> = ref({
    Sn: '',
    startPointX: 0,
    startPointY: 0,
    mapWidth: 0,
    mapHeight: 0,
    actorWidth: 0,
    actorPxWidth: 1024,
    offsetX: 0,
    offsetY: 0,
    offsetWidth: 0,
    offsetHeight: 0,
  });

  watch(
    () => props.visible,
    () => {
      if (props.visible) {
        if (configRef.getProjectSizeConfig) {
          projectConfigRef.value = Object.assign({}, configRef.getProjectSizeConfig);
        }
      }
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
      content: '修改地图尺寸将刷新页面！数据将被自动保存！',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
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
    }
    .remind {
      text-align: center;
      color: @warning-color;
    }
  }
</style>
