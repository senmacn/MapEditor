<template>
  <a-modal
    class="pin-modal"
    :width="360"
    :visible="visibleRef"
    :closable="false"
    :onCancel="handleCancel"
    :title="null"
    :footer="null"
  >
    <div class="pin-wrapper">
      <div class="title">地图钉配置</div>
      <a-form
        ref="pinFormRef"
        :model="formModel"
        :labelCol="{ span: 4 }"
        :wrapperCol="{ span: 20 }"
        labelAlign="right"
      >
        <a-form-item
          name="name"
          label="名称"
          :validate-trigger="['change', 'input']"
          :rules="[{ required: true, message: '请填写名称！' }]"
        >
          <a-input size="small" v-model:value="formModel.name" />
        </a-form-item>
        <a-form-item name="description" label="描述">
          <a-textarea
            size="small"
            v-model:value="formModel.description"
            auto-size
            show-word-limit
            :max-length="100"
          />
        </a-form-item>
        <a-form-item name="level" label="等级">
          <a-rate size="small" v-model:value="formModel.level" allow-half />
        </a-form-item>
        <a-form-item name="icon" label="图标">
          <a-radio-group type="button" v-model:value="formModel.icon" size="small">
            <a-radio-button value="flag">
              <svg-icon name="flag" :size="16"></svg-icon>
            </a-radio-button>
            <a-radio-button value="pin">
              <svg-icon name="pin" :size="16"></svg-icon>
            </a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item name="size" label="尺寸">
          <a-radio-group v-model:value="formModel.size" size="small" type="button">
            <a-radio-button value="40">Small</a-radio-button>
            <a-radio-button value="60">Medium</a-radio-button>
            <a-radio-button value="80">Large</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item name="color" label="颜色">
          <span id="pickr-instance"> </span>
        </a-form-item>
        <a-form-item name="position" label="坐标">
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
  let uuid = '';
  const layersRef: Ref<Layer[]> = inject('layers', [] as any);
  const pinFormRef = ref();
  function handleOk() {
    pinFormRef.value.validate().then(() => {
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
            element.pins.forEach((sitPin) => {
              if (sitPin.getUuid() === uuid) {
                sitPin.setName(formModel.name);
                sitPin.setDescription(formModel.description);
                sitPin.setLevel(formModel.level);
                sitPin.setIcon(formModel.icon);
                sitPin.setColor(formModel.color);
                sitPin.setBoundRect([formModel.position.x, formModel.position.y, size, size]);
              }
            });
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

  function setPin(pin: Pin) {
    if (isNull(pin)) {
      Object.assign(formModel, cloneDeep(initFormModel));
      isCreate = true;
    } else {
      isCreate = false;
      Object.assign(formModel, pin);
      uuid = pin.getUuid();
    }
    visibleRef.value = true;
  }
  defineExpose({
    setPin: setPin,
  });
</script>

<style lang="less">
  .pin-modal {
    .ant-modal-header {
      display: none;
    }
    .ant-modal-content {
      padding: 4px;
    }
    .pin-wrapper {
      overflow: auto;
      span,
      label {
        font-size: 12px;
      }
    }
    .title {
      line-height: 40px;
      font-size: 14px;
      font-weight: bold;
      text-align: center;
    }
    .ant-form {
      padding: 0 20px;
    }
    .button-group {
      display: flex;
      justify-content: space-around;
      align-items: start;
      width: 80%;
      height: 50px;
      margin: 0 auto;
      .ant-btn {
        width: 70px;
        height: 35px;
        font-size: 12px;
      }
    }
    .ant-radio-button-content {
      padding: 4px;
    }
  }
</style>
