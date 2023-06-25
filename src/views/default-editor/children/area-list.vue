<template>
  <ul class="layer-areas">
    <li class="area-item" v-for="(area, index) in visibleList" :key="index">
      <div class="area-index">
        <a-tooltip title="隐藏区域" v-if="!hideStatesRef[area.getUuid()]">
          <a-button type="text" class="success-color" @click="() => hideElement(area)">
            <template #icon><eye-outlined /></template>
          </a-button>
        </a-tooltip>
        <a-tooltip title="显示区域" v-else>
          <a-button type="text" @click="() => showElement(area)">
            <template #icon><eye-invisible-outlined /></template>
          </a-button>
        </a-tooltip>
      </div>
      <div class="area-name">
        <a-tooltip :title="'类型-' + area.type">
          <gateway-outlined v-if="area instanceof Area" />
          <pushpin-outlined v-else></pushpin-outlined>

          {{ area.getName() }}
        </a-tooltip>
      </div>
      <div class="area-option">
        <a-tooltip title="快速定位">
          <a-button type="text" @click="handleGotoArea(area)" :disabled="lock">
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
  import { computed, reactive } from 'vue';
  import DrawElement, { Area, Pin } from '../draw-element';
  import { emitFocusAreaEvent } from '../common/event';
  import {
    PushpinOutlined,
    GatewayOutlined,
    AimOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
  } from '@ant-design/icons-vue';

  const props = defineProps({
    areas: {
      type: Array as PropType<Area[]>,
      default: () => [],
    },
    pins: {
      type: Array as PropType<Pin[]>,
      default: () => [],
    },
    lock: {
      type: Boolean,
      default: false,
    }
  });

  const visibleList = computed(() => {
    if (props.areas.length + props.pins.length > 0) {
      return [...props.areas, ...props.pins].filter((ele) => ele.visible);
    } else {
      return [];
    }
  });

  const hideStatesRef = reactive({});
  function showElement(ele: DrawElement) {
    ele.show();
    hideStatesRef[ele.getUuid()] = false;
  }
  function hideElement(ele: DrawElement) {
    ele.hide();
    hideStatesRef[ele.getUuid()] = true;
  }

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
    }
    .area-index {
      width: 60px;
      text-align: center;
    }
    .area-name {
      flex: 1;
      border-right: 1px solid @color-border-table;
    }
    .area-option {
      width: 140px;
      display: flex;
      justify-content: space-around;
    }
    .ant-btn {
      display: inline-block;
      height: 16px;
      width: 32px;
    }
  }
</style>
