<template>
  <section
    class="full-loading"
    :class="{ absolute }"
    :style="[background ? `background-color: ${background}` : '']"
    v-show="loading"
  >
    <a-spin v-bind="$attrs" :tip="tip" :size="size" :spinning="loading" />
  </section>
</template>

<script lang="ts" setup>
  import { PropType } from 'vue';
  import { SizeEnum } from './typing';

  const props = defineProps({
    tip: {
      type: String as PropType<string>,
      default: '',
    },
    size: {
      type: Number as PropType<SizeEnum>,
      default: SizeEnum.LARGE,
    },
    absolute: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
    loading: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
    background: {
      type: String as PropType<string>,
    },
  });
</script>

<style lang="less" scoped>
  .full-loading {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 200;
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
    background-color: rgb(240 242 245 / 40%);

    &.absolute {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 300;
    }
  }
</style>
