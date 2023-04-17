<template>
  <ul class="layer-areas">
    <li class="area-item" v-for="area in areas" :key="area.getName()">
      <div class="area-index"></div>
      <div class="area-name"><icon-mosaic /> {{ area.getName() }} </div>
      <div class="area-option">
        <a-tooltip content="聚焦区域">
          <a-button type="text" @click="handleGotoArea(area)">
            <template #icon>
              <icon-location />
            </template>
          </a-button>
        </a-tooltip>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
  import Area from '../common/area';
  import { emitFocusAreaEvent } from '../common/event';

  const props = defineProps({
    areas: {
      type: Array as PropType<Area[]>,
      default: () => [],
    },
  });

  function handleGotoArea(area: Area) {
    emitFocusAreaEvent(area);
  }
</script>

<style lang="less" scoped>
  .layer-areas {
    width: 100%;
    padding: 0;
    margin: 0;
    border-top: 1px solid var(--color-border-2);
    line-height: 20px;
    .area-item {
      display: flex;
      text-align: center;
      height: 20px;
    }
    .area-index {
      width: 100px;
    }
    .area-name {
      flex: 1;
      border-right: 1px solid var(--color-border-3);
    }
    .area-option {
      width: 140px;
    }
    .arco-btn {
      width: 100%;
      height: 100%;
    }
  }
</style>
