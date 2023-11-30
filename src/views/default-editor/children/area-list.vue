<template>
  <ul class="layer-areas" v-auto-animate>
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
      <div class="area-name" @click="changeName(index, area.getName())">
        <a-tooltip :title="'类型-' + area.type">
          <gateway-outlined v-if="Boolean(area instanceof Area)" />
          <pushpin-outlined v-if="Boolean(area instanceof Pin)" />
          <node-index-outlined v-if="Boolean(area instanceof Pathway)" />
          <span v-if="changeNameItemRef.index !== index">{{ area.getName() }}</span>
          <a-input
            v-else
            class="change-name-input"
            type="text"
            v-model:value="changeNameItemRef.name"
            :disabled="lock"
            @blur="changeNameEnd($event, index)"
          />
        </a-tooltip>
      </div>
      <div class="area-option">
        <a-tooltip title="切换图层">
          <a-button type="text" @click="handleChangeLayer(area)" :disabled="lock">
            <template #icon>
              <swap-outlined />
            </template>
          </a-button>
        </a-tooltip>
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
  <change-layer-modal
    :visible="changeLayerVisibleRef"
    :element="changeLayerElementRef"
    @close="changeLayerVisibleRef = false"
  ></change-layer-modal>
</template>

<script setup lang="ts">
  import type { Ref } from 'vue';
  import type DrawElement from '../draw-element';
  import { computed, reactive, ref } from 'vue';
  import { Area, Pathway, Pin } from '../draw-element';
  import { emitFocusAreaEvent } from '../common/event';
  import {
    PushpinOutlined,
    GatewayOutlined,
    SwapOutlined,
    AimOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    NodeIndexOutlined,
  } from '@ant-design/icons-vue';
  import ChangeLayerModal from './change-layer-modal.vue';
  import { message } from 'ant-design-vue';

  const props = defineProps({
    areas: {
      type: Array as PropType<Area[]>,
      default: () => [],
    },
    pins: {
      type: Array as PropType<Pin[]>,
      default: () => [],
    },
    pathways: {
      type: Array as PropType<Pathway[]>,
      default: () => [],
    },
    lock: {
      type: Boolean,
      default: false,
    },
  });

  const visibleList = computed(() => {
    return [...props.areas, ...props.pins, ...props.pathways].filter((ele) => ele.visible);
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

  const changeLayerVisibleRef = ref(false);
  const changeLayerElementRef: Ref<DrawElement | undefined> = ref();
  function handleChangeLayer(area: DrawElement) {
    changeLayerVisibleRef.value = true;
    changeLayerElementRef.value = area;
  }

  function handleGotoArea(area: DrawElement) {
    emitFocusAreaEvent(area);
  }

  const changeNameItemRef = ref({
    index: -1,
    name: '',
  });
  function changeName(index, name) {
    if (changeNameItemRef.value.index === index) return;
    changeNameItemRef.value = { index, name };
    setTimeout(() => {
      const element = <HTMLElement>document.querySelector('input.change-name-input');
      element.focus();
    }, 16);
  }
  function changeNameEnd(e, index) {
    const value: string = e.target.value;
    if (!value.includes('-')) {
      changeNameItemRef.value = {
        index: -1,
        name: '',
      };
      message.warning('区域名称不正确！');
      return;
    }
    const area = visibleList.value[index];
    if (value && value !== area.getName() && area.layer?.uuid) {
      const target = <HTMLElement | null>document.getElementById(area.layer?.uuid);
      if (target) {
        area.setName(value);
        area.draw = 'update';
        area.render(target);
      }
    }
    changeNameItemRef.value = {
      index: -1,
      name: '',
    };
  }
</script>

<style lang="less" scoped>
  .layer-areas {
    width: 100%;
    padding: 0;
    margin: 0;
    border-top: 1px solid @color-border-table;
    line-height: 24px;
    .area-item {
      display: flex;
      text-align: center;
      align-items: center;
      border-bottom: 1px solid @color-border-table;
      min-height: 24px;
    }
    .area-index {
      width: 60px;
      text-align: center;
    }
    .area-name {
      flex: 1;
      max-width: 300px;
      border-right: 1px solid @color-border-table;
      overflow: visible;
      white-space: nowrap;
      input.ant-input {
        display: inline-block;
        height: 100%;
        width: 80%;
        border: 0;
        font-size: 12px;
        line-height: 26px;
      }
    }
    .area-option {
      width: 120px;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2;
    }
    .ant-btn {
      display: inline-block;
      height: 16px;
      width: 32px;
      line-height: 16px;
      .anticon {
        font-size: 14px;
      }
    }
  }
</style>
