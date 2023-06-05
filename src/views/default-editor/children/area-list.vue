<template>
  <ul class="layer-areas">
    <li class="area-item" v-for="(area, index) in visibleList" :key="index">
      <div class="area-index"></div>
      <div class="area-name">
        <border-outlined v-if="area instanceof Area" />
        <pushpin-outlined v-else></pushpin-outlined>
        {{ area.getName() }}
      </div>
      <div class="area-option">
        <a-tooltip title="快速定位">
          <a-button type="text" @click="handleGotoArea(area)">
            <template #icon>
              <aim-outlined />
            </template>
          </a-button>
        </a-tooltip>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import DrawElement, { Area, Pin } from '../draw-element';
  import { emitFocusAreaEvent } from '../common/event';
  import { PushpinOutlined, BorderOutlined, AimOutlined } from '@ant-design/icons-vue';

  const props = defineProps({
    areas: {
      type: Array as PropType<Area[]>,
      default: () => [],
    },
    pins: {
      type: Array as PropType<Pin[]>,
      default: () => [],
    },
  });

  const visibleList = computed(() => {
    if (props.areas.length + props.pins.length > 0) {
      return [...props.areas, ...props.pins];
    } else {
      return [];
    }
  });

  function handleGotoArea(area: DrawElement) {
    emitFocusAreaEvent(area);
  }
</script>

<style lang="less" scoped>
  .layer-areas {
    width: 100%;
    padding: 0;
    margin: 0;
    border-top: 1px solid @color-border-table;
    line-height: 20px;
    .area-item {
      display: flex;
      text-align: center;
      height: 20px;
    }
    .area-index {
      width: 20px;
    }
    .area-name {
      flex: 1;
      border-right: 1px solid @color-border-table;
    }
    .area-option {
      width: 140px;
    }
    .ant-btn {
      width: 100%;
      height: 100%;
    }
  }
</style>
