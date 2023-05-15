<template>
  <svg aria-hidden="true" :style="style">
    <use :href="symbolId" :fill="color" />
  </svg>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';

  const props = defineProps({
    prefix: {
      type: String,
      default: 'icon',
    },
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: 'white',
    },
    size: {
      type: Number,
      default: 24
    }
  });

  const symbolId = computed(() => `#${props.prefix}-${props.name}`);
  const style = computed(() => `width: ${props.size}px; height: ${props.size}px`);
</script>
