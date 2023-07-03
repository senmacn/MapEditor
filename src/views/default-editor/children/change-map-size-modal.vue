<template>
  <a-modal
    class="change-map-size-modal"
    :width="800"
    :visible="visible"
    @cancel="emit('close')"
    @ok="handleChange"
    :closable="false"
  >
    <div class="modal-title">尺寸设置</div>
    <div class="modal-content">
      <div class="left-box">
        <div class="map-size">地图坐标参数(可选)</div>
        <div class="map-size">
          <a-tooltip title="单张图片对应的地块大小数值">
            <span>
              坐标/每1024px:
              <info-circle-outlined class="warning-color" />
            </span>
          </a-tooltip>
          <a-input v-model:value="mapConfig.fullScale" suffix="cm/1024px"></a-input>
        </div>
        <div class="map-size">
          <span>地图左上角X坐标:</span>
          <a-input v-model:value="mapConfig.map_ltX"></a-input>
        </div>
        <div class="map-size">
          <span>地图左上角Y坐标:</span>
          <a-input v-model:value="mapConfig.map_ltY"></a-input>
        </div>
        <div class="map-size">
          <span>地图右下角X坐标:</span>
          <a-input v-model:value="mapConfig.map_rbX"></a-input>
        </div>
        <div class="map-size">
          <span>地图右下角Y坐标:</span>
          <a-input v-model:value="mapConfig.map_rbY"></a-input>
        </div>
        <div class="map-size">
          <span>图片左上角X坐标:</span>
          <a-input v-model:value="mapConfig.ltX"></a-input>
        </div>
        <div class="map-size">
          <span>图片左上角Y坐标:</span>
          <a-input v-model:value="mapConfig.ltY"></a-input>
        </div>
        <div class="map-size">
          <span>图片右下角X坐标:</span>
          <a-input v-model:value="mapConfig.rbX"></a-input>
        </div>
        <div class="map-size">
          <span>图片右下角Y坐标:</span>
          <a-input v-model:value="mapConfig.rbY"></a-input>
        </div>
      </div>
      <div style="text-align: center; margin-bottom: 12px; padding-top: 25%">
        <a-button type="primary" @click="handleAutoTransform">
          转换
          <swap-right-outlined #icon></swap-right-outlined>
        </a-button>
      </div>
      <div class="right-box">
        <div class="map-size">编辑器数据参数(必选)</div>
        <div class="map-size">
          <a-tooltip title="单张图片对应的地块大小 xxx / 1024px 得到的数值(cm/px)">
            <span>
              比例尺:
              <info-circle-outlined class="warning-color" />
            </span>
          </a-tooltip>
          <a-input v-model:value="scaleRef" suffix="cm/px"></a-input>
        </div>
        <div class="map-size">
          <span>偏移X:</span>
          <a-input v-model:value="offsetXRef" suffix="px"> </a-input>
        </div>
        <div class="map-size">
          <span>偏移Y:</span>
          <a-input v-model:value="offsetYRef" suffix="px"> </a-input>
        </div>
        <div class="map-size">
          <span>长度:</span>
          <a-input v-model:value="xRef" suffix="px"> </a-input>
        </div>
        <div class="map-size">
          <span>宽度:</span>
          <a-input v-model:value="yRef" suffix="px"> </a-input>
        </div>
        <div class="map-size">
          <span>全图长度:</span>
          <a-input v-model:value="allXRef" suffix="px"> </a-input>
        </div>
        <div class="map-size">
          <span>全图宽度:</span>
          <a-input v-model:value="allYRef" suffix="px"> </a-input>
        </div>
      </div>
    </div>

    <div class="remind">
      左侧【地图坐标参数】可选填，用于快速换算右侧的【编辑器数据参数】，同时填写后可以将标尺与游戏实际坐标对应
    </div>
    <div class="remind"> 右侧【编辑器数据参数】必填，直接影响数据的正确性 </div>
    <div class="remind">
      <span class="error-color">修改地图尺寸会刷新页面！ </span>
      数据将被自动保存！
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import modal from 'ant-design-vue/lib/modal';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { InfoCircleOutlined, SwapRightOutlined } from '@ant-design/icons-vue';
  import { isNumber } from '@/utils/is';
  import { message } from 'ant-design-vue';
  import { getLocalApi } from '@/utils/env';

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
  const scaleRef = ref();
  const offsetXRef = ref();
  const offsetYRef = ref();
  const xRef = ref();
  const yRef = ref();
  const allXRef = ref();
  const allYRef = ref();
  watch(
    () => props.visible,
    () => {
      if (props.visible) {
        scaleRef.value = String(configRef.size.scale);
        offsetXRef.value = String(configRef.size.offsetX);
        offsetYRef.value = String(configRef.size.offsetY);
        xRef.value = String(configRef.size.x);
        yRef.value = String(configRef.size.y);
        allXRef.value = String(configRef.size.allX);
        allYRef.value = String(configRef.size.allY);

        if (configRef.getMapSize) {
          mapConfig.value = configRef.getMapSize as any;
        }
      }
    },
  );

  const mapConfig = ref({
    fullScale: 0,
    used: 0,
    map_ltX: 0,
    map_ltY: 0,
    map_rbX: 0,
    map_rbY: 0,
    ltX: 0,
    ltY: 0,
    rbX: 0,
    rbY: 0,
  });
  function handleAutoTransform() {
    for (const key of Object.keys(mapConfig.value)) {
      const element = mapConfig.value[key];
      if (!String(element).length && key !== 'fullScale') {
        message.warning('转换前请确保填写所有地图/图片XY坐标参数！');
        return;
      }
    }
    const { fullScale, map_ltX, map_ltY, map_rbX, map_rbY, ltX, ltY, rbX, rbY } = mapConfig.value;
    if (fullScale) {
      scaleRef.value = fullScale / 1024;
    } else if (!scaleRef.value) {
      message.warning('请至少填写比例尺/每1024px坐标之中其中一个！');
      return;
    }
    const scale = scaleRef.value;
    offsetXRef.value = (ltX - map_ltX) / scale;
    offsetYRef.value = (ltY - map_ltY) / scale;
    xRef.value = (rbX - ltX) / scale;
    yRef.value = (rbY - ltY) / scale;
    allXRef.value = (map_rbX - map_ltX) / scale;
    allYRef.value = (map_rbY - map_ltY) / scale;

    mapConfig.value.used = 1;
  }

  function handleChange() {
    const sizeObj = {
      scale: Number(scaleRef.value),
      offsetX: Number(offsetXRef.value),
      offsetY: Number(offsetYRef.value),
      x: Number(xRef.value),
      y: Number(yRef.value),
      allX: Number(allXRef.value),
      allY: Number(allYRef.value),
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
        configRef.setSize(sizeObj);

        if (mapConfig.value.used || Object.keys(mapConfig.value).some((val) => !!val)) {
          mapConfig.value.used = 1;
          const mapObj = {
            fullScale: Number(mapConfig.value.fullScale),
            used: Number(mapConfig.value.used),
            map_ltX: Number(mapConfig.value.map_ltX),
            map_ltY: Number(mapConfig.value.map_ltY),
            map_rbX: Number(mapConfig.value.map_rbX),
            map_rbY: Number(mapConfig.value.map_rbY),
            ltX: Number(mapConfig.value.ltX),
            ltY: Number(mapConfig.value.ltY),
            rbX: Number(mapConfig.value.rbX),
            rbY: Number(mapConfig.value.rbY),
          };
          configRef.setMapSize(mapObj);

          // 自动保存数据
          const localApi = getLocalApi();
          if (localApi) {
            localApi.setUserConfig({
              sizeObj,
              mapObj,
            } as any as UserConfig);
          }
        }
        emit('change-size');
      },
    });
  }
</script>

<style lang="less">
  .ant-modal {
    border-radius: 4px;
  }
  .change-map-size-modal {
    .ant-modal-body {
      padding: 0;
      border-radius: 4px;
    }
    .modal-title {
      padding: 8px;
      border-bottom: 1px solid @color-modal-border;
      text-align: center;
    }
    .modal-content {
      display: flex;
      justify-content: space-around;
      padding: 32px;
    }
    .map-size {
      display: flex;
      margin-bottom: 12px;
      > span:first-child {
        width: 120px;
        text-align: center;
      }
      .ant-input,
      .ant-input-affix-wrapper {
        width: 160px;
      }
    }
    .remind {
      text-align: center;
      color: @warning-color;
    }
  }
</style>
