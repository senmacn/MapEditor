<template>
  <a-modal
    class="pin-modal"
    :width="360"
    :mask="true"
    :mask-closable="true"
    simple
    :visible="visibleRef"
    :onCancel="handleCancel"
    :title="null"
    :footer="null"
  >
    <div class="pin-wrapper">
      <div class="title">地图钉配置</div>
      <a-form ref="pinFormRef" :model="formModel" size="mini" layout="horizontal">
        <a-form-item
          field="name"
          label="名称"
          :validate-trigger="['change', 'input']"
          :rules="[{ required: true, message: '请填写名称！' }]"
        >
          <a-input size="mini" v-model="formModel.name" />
        </a-form-item>
        <a-form-item field="description" label="描述">
          <a-textarea
            size="mini"
            v-model="formModel.description"
            auto-size
            show-word-limit
            :max-length="100"
          />
        </a-form-item>
        <a-form-item field="level" label="等级">
          <a-rate size="mini" v-model="formModel.level" allow-half />
        </a-form-item>
        <a-form-item field="icon" label="图标">
          <a-radio-group type="button" v-model="formModel.icon" size="mini">
            <a-radio value="flag">
              <svg-icon name="flag" :size="16"></svg-icon>
            </a-radio>
            <a-radio value="pin">
              <svg-icon name="pin" :size="16"></svg-icon>
            </a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="size" label="尺寸">
          <a-radio-group v-model="formModel.size" size="mini" type="button">
            <a-radio value="40">Small</a-radio>
            <a-radio value="60">Medium</a-radio>
            <a-radio value="80">Large</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="color" label="颜色">
          <span id="pickr-instance"> </span>
        </a-form-item>
        <a-form-item field="position" label="坐标">
          <span>{{ clickPositionRef?.offsetX }}, {{ clickPositionRef?.offsetY }}</span>
        </a-form-item>
      </a-form>
    </div>
    <div class="button-group">
      <a-button type="primary" @click="handleOk">确定</a-button>
      <a-button @click="handleCancel">取消</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import { Ref, inject, reactive, ref, watch } from 'vue';
  import SvgIcon from '@/components/svg-icon.vue';
  import { useColorPicker } from '@/hooks/useColorPicker';
  import { isNull } from '@/utils/is';
  import cloneDeep from 'lodash-es/cloneDeep';
  import { Layer } from '../common/types';
  import { Pin } from '../draw-element';

  const clickPositionRef = inject<Recordable>('clickPositionRef', { offsetX: 0, offsetY: 0 });
  const initFormModel = {
    name: '',
    description: '',
    color: 'red',
    icon: 'flag',
    size: '60',
    level: 2.5,
    position: { x: 0, y: 0 },
  };
  const formModel = reactive(cloneDeep(initFormModel));

  const visibleRef = ref(false);
  let isCreate = false;
  const layersRef: Ref<Layer[]> = inject('layers', [] as any);
  const pinFormRef = ref();
  function handleOk() {
    pinFormRef.value.validate().then((err) => {
      if (err) return;

      const size = Number(formModel.size);
      formModel.position = {
        x: clickPositionRef.offsetX - size / 2,
        y: clickPositionRef.offsetY - size / 2,
      };
      for (let index = layersRef.value.length - 1; index >= 0; index--) {
        const element = layersRef.value[index];
        if (element.hot) {
          if (isCreate) {
            const pin = new Pin(
              formModel.name,
              formModel.description,
              formModel.level,
              formModel.color,
              formModel.position,
              size,
              formModel.icon,
            );
            element.pins.push(pin);
          } else {
          }
        }
      }

      visibleRef.value = false;
    });
  }

  function handleCancel() {
    visibleRef.value = false;
  }

  const pickrInstance = useColorPicker('#pickr-instance');
  watch(
    () => visibleRef.value,
    () => {
      if (visibleRef.value && !pickrInstance.hasInit()) {
        setTimeout(() => {
          pickrInstance.init();
          pickrInstance.on('save', (color) => {
            formModel.color = color.toRGBA().toString();
          });
        }, 10);
      }
    },
  );

  function setPin(pin) {
    if (isNull(pin)) {
      Object.assign(formModel, cloneDeep(initFormModel));

      isCreate = true;
    } else {
      isCreate = false;
    }
    visibleRef.value = true;
  }
  defineExpose({
    setPin: setPin,
  });
</script>

<style lang="less">
  .pin-modal {
    .arco-modal-header {
      display: none;
    }
    .arco-modal-simple {
      padding: 0;
    }
    .pin-wrapper {
      padding: 8px;
      margin-right: 20px;
      overflow: auto;
    }
    .title {
      line-height: 40px;
      font-size: 14px;
      font-weight: bold;
      text-align: center;
    }
    .button-group {
      display: flex;
      justify-content: space-around;
      align-items: start;
      width: 80%;
      height: 50px;
      margin: 0 auto;
      .arco-btn {
        width: 70px;
        height: 35px;
        font-size: 12px;
      }
    }
    span {
      font-size: 12px;
    }
    .arco-radio-button-content {
      padding: 4px;
    }
  }
</style>
