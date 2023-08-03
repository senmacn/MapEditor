<template>
  <a-space class="controller-slider">
    <span class="slider-value">{{ (100 * sliderValueRef).toFixed(0) + '%' }}</span>
    <a-tooltip title="ctrl + -">
      <minus-circle-outlined @click="handleDown" />
    </a-tooltip>
    <a-slider
      :max="5"
      :min="0.1"
      :step="0.1"
      :default-value="1"
      v-model:value="sliderValueRef"
    ></a-slider>
    <a-tooltip title="ctrl + +">
      <plus-circle-outlined @click="handleUp" />
    </a-tooltip>
  </a-space>
</template>

<script setup lang="ts">
  import { Ref, ref, watch } from 'vue';
  import { ControlledSliderAction, ControlledSliderProps } from './types';
  import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons-vue';

  const emits = defineEmits<{
    (e: 'register', slider: ControlledSliderAction): void;
  }>();

  const propsRef: Ref<ControlledSliderProps> = ref({});
  function setProps(props: ControlledSliderProps) {
    if (props) {
      propsRef.value = { ...props };
    }
  }

  const sliderValueRef = ref(1);
  watch(
    () => sliderValueRef.value,
    () => {
      propsRef.value.onChange && propsRef.value?.onChange(sliderValueRef.value);
    },
  );

  function handleUp() {
    sliderValueRef.value = sliderValueRef.value + 0.1;
  }

  function handleDown() {
    sliderValueRef.value = sliderValueRef.value - 0.1;
  }

  function setValue(val: number) {
    sliderValueRef.value = val;
  }

  const slider = {
    getValue() {
      return sliderValueRef.value;
    },
    zoomIn: handleUp,
    zoomOut: handleDown,
    setProps: setProps,
    setValue: setValue,
  };

  emits('register', slider);
</script>

<style lang="less">
  .controller-slider {
    width: 380px;
    height: 100%;
    padding: 0 20px;
    .anticon {
      display: inline-block;
      font-size: 14px;
      cursor: pointer;
    }
    .anticon:hover {
      color: rgb(118, 163, 253);
    }
    .slider-value {
      width: 38px;
      font-size: 12px;
      font-weight: bold;
    }
    .ant-slider {
      width: 250px;
      &.ant-slider-with-marks {
        margin-bottom: 12px;
      }
      .ant-slider-mark {
        display: none;
      }
    }
    .ant-slider-rail,
    .ant-slider-track {
      background-color: #17171a;
    }
    .ant-slider:hover {
      .ant-slider-rail,
      .ant-slider-track {
        background-color: #17171a;
      }
    }
  }
</style>
