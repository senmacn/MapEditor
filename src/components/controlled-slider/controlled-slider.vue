<template>
  <div class="controller-slider">
    <span class="slider-value">{{ VALUES[valueIndexRef] * 100 + '%' }}</span>
    <a-button @click="handleDown">
      <template #icon>
        <icon-minus />
      </template>
    </a-button>
    <a-slider
      :max="2"
      :min="0"
      :default-value="1"
      :show-tooltip="false"
      :marks="VALUE_MARKS"
      :step="0.25"
      v-model="sliderValueRef"
      @change="handleChange"
    ></a-slider>
    <a-button @click="handleUp">
      <template #icon>
        <icon-plus />
      </template>
    </a-button>
  </div>
</template>

<script setup lang="ts">
  import ASlider from '@arco-design/web-vue/es/slider';
  import AButton from '@arco-design/web-vue/es/button';
  import { Ref, ref, unref, watch } from 'vue';
  import { ControlledSliderAction, ControlledSliderProps } from './types';

  const VALUES = [0.25, 0.5, 1, 1.25, 1.5, 2];
  const VALUE_MARKS = {
    0.25: '25%',
    0.5: '50%',
    1: '100%',
    1.25: '125%',
    1.5: '150%',
    2: '200%',
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
    display: flex;
    align-items: center;
    flex: 1;
    margin: 5px 0;
    height: 32px;
  }
  .slider-value {
    width: 36px;
    font-size: 12px;
    font-weight: bold;
  }
  .arco-slider {
    width: 100%;
    padding: 0 5px;
    &.arco-slider-with-marks {
      margin-bottom: 12px;
    }

    .arco-slider-marks .arco-slider-mark {
      font-size: 8px;
    }
  }
</style>
