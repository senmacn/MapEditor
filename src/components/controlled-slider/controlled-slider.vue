<template>
  <a-space class="controller-slider">
    <span class="slider-value">{{ VALUES[valueIndexRef] * 100 + '%' }}</span>
    <a-tooltip title="ctrl + -">
      <minus-circle-outlined @click="handleDown" />
    </a-tooltip>
    <a-slider
      :max="4"
      :min="0.25"
      :step="null"
      :default-value="1"
      :marks="VALUE_MARKS"
      v-model:value="sliderValueRef"
      @change="handleChange"
    ></a-slider>
    <a-tooltip title="ctrl + +">
      <plus-circle-outlined @click="handleUp" />
    </a-tooltip>
  </a-space>
</template>

<script setup lang="ts">
  import { Ref, ref, unref, watch } from 'vue';
  import { ControlledSliderAction, ControlledSliderProps } from './types';
  import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons-vue';

  const VALUES = [0.25, 0.5, 1, 2, 3, 4];
  const VALUE_MARKS = {
    0.25: '25%',
    0.5: '50%',
    1: '100%',
    2: '200%',
    3: '300%',
    4: '400%',
  };

  const emits = defineEmits<{
    (e: 'register', slider: ControlledSliderAction): void;
  }>();

  const propsRef: Ref<ControlledSliderProps> = ref({});
  function setProps(props: ControlledSliderProps) {
    if (props) {
      propsRef.value = { ...props };
    }
  }

  const valueIndexRef = ref(2);
  watch(
    () => valueIndexRef.value,
    () => {
      propsRef.value.onChange && propsRef.value?.onChange(VALUES[valueIndexRef.value]);
      sliderValueRef.value = VALUES[valueIndexRef.value];
    },
  );

  function handleUp() {
    valueIndexRef.value =
      valueIndexRef.value < VALUES.length - 1 ? valueIndexRef.value + 1 : VALUES.length - 1;
  }

  function handleDown() {
    valueIndexRef.value = valueIndexRef.value > 0 ? valueIndexRef.value - 1 : 0;
  }

  const sliderValueRef = ref(1);
  function handleChange(newVal: any) {
    if (newVal === VALUES[valueIndexRef.value]) return;
    if (newVal < 0.25) {
      valueIndexRef.value = 0;
      return;
    }
    for (let index = 0; index < VALUES.length; index++) {
      const element = VALUES[index];
      if (newVal === element) {
        valueIndexRef.value = index;
        break;
      }
      // if (newVal > element && newVal < VALUES[index + 1]) {
      //   if (newVal > VALUES[valueIndexRef.value]) {
      //     valueIndexRef.value = index + 1;
      //   } else {
      //     valueIndexRef.value = index;
      //   }
      // }
    }
    sliderValueRef.value = VALUES[valueIndexRef.value];
  }

  const slider = {
    getValue() {
      return VALUES[unref(valueIndexRef)];
    },
    zoomIn: handleUp,
    zoomOut: handleDown,
    setProps: setProps,
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
      font-size: 8px;
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
      .ant-slider-marks .ant-slider-mark {
        font-size: 8px;
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
