<template>
  <a-modal
    class="change-map-size-modal"
    :width="500"
    :visible="visible"
    :closable="false"
    :footer="null"
  >
    <div class="modal-content">
      <a-row class="option-group" style="height: 200px">
        <a-col class="row-label" :span="4">设置</a-col>
        <a-col :span="8">
          <div class="auto-connect">
            <span>自动连接: </span>
            <a-switch
              :checked="configRef.autoConnect"
              @change="(value: any) => configRef.setAutoConnect(value)"
            />
          </div>
        </a-col>
        <a-col :span="10">
          <div>
            <span>连接范围</span>
            <a-input-number
              :disabled="!configRef.getAutoConnect"
              :max="60"
              :min="18"
              :step="2"
              :value="configRef.getAutoConnectScope"
              @change="(value) => configRef.setAutoConnectScope(Number(value))"
            ></a-input-number>
          </div>
        </a-col>
        <a-col class="pickr-wrapper" :span="8" :offset="4">
          <span>线条颜色 </span>
          <span id="pickr-instance"> </span>
        </a-col>
        <a-col :span="12">
          <span>线条宽度 </span>
          <a-input-number
            mode="button"
            :max="10"
            :min="1"
            :step="1"
            :precision="1"
            :default-value="configRef.lineWidth"
            :formatter="(value: number) => Number(value).toFixed(0)"
            @change="(num: number) => configRef.setLineWidth(num)"
          />
        </a-col>
      </a-row>
    </div>
    <div class="confirm-button-group">
      <a-button @click="emit('close')">关闭</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import { watch } from 'vue';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { useColorPicker } from '@/hooks/useColorPicker';

  const emit = defineEmits<{
    (e: 'close'): void;
  }>();

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false,
    },
  });

  const configRef = useEditorConfig();

  let inited = false;
  const pickrInstance = useColorPicker('.change-map-size-modal #pickr-instance');
  watch(
    () => props.visible,
    () => {
      if (props.visible && !inited) {
        setTimeout(() => {
          pickrInstance.init();
          pickrInstance.on('save', (color) => {
            configRef.setColor(color.toRGBA().toString());
          });
        });
      }
    },
  );
</script>

<style lang="less">
</style>
