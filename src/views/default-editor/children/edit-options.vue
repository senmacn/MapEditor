<template>
  <div :class="['edit-options', editShowRef ? 'long' : 'small']" @mouseleave="handleHiddenEditOptions">
    <template v-if="editShowRef">
      <a-tooltip title="画笔">
        <a-button
          :class="[controller.getState() === CanvasOption.FollowMouse && 'actived']"
          @click="() => handleChangeOptionState(CanvasOption.FollowMouse)"
        >
          <edit-filled />
        </a-button>
      </a-tooltip>
      <a-tooltip title="钢笔">
        <a-button
          :class="[controller.getState() === CanvasOption.Pen && 'actived']"
          @click="() => handleChangeOptionState(CanvasOption.Pen)"
        >
          <edit-filled />
        </a-button>
      </a-tooltip>
      <a-tooltip title="橡皮">
        <a-input-group compact>
          <a-button
            :class="[controller.getState() === CanvasOption.FollowMouseClear && 'actived']"
            @click="() => handleChangeOptionState(CanvasOption.FollowMouseClear)"
          >
            <highlight-outlined />
          </a-button>
          <a-select
            class="button-select"
            :class="[controller.getState() === CanvasOption.FollowMouseClear && 'actived']"
            :value="config.getEraseSize"
            @change="
              (val) => {
                handleChangeOptionState(CanvasOption.FollowMouseClear);
                config.setEraseSize(Number(val));
              }
            "
          >
            <a-select-option :value="5">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                stroke="currentColor"
                class="anticon"
                stroke-width="4"
                stroke-linecap="butt"
                stroke-linejoin="miter"
              >
                <circle r="12" cx="24" cy="24" />
              </svg>
            </a-select-option>
            <a-select-option :value="10">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                stroke="currentColor"
                class="anticon"
                stroke-width="4"
                stroke-linecap="butt"
                stroke-linejoin="miter"
              >
                <circle r="20" cx="24" cy="24" />
              </svg>
            </a-select-option>
            <a-select-option :value="15">
              <svg
                viewBox="0 0 60 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                stroke="currentColor"
                class="anticon"
                stroke-width="4"
                stroke-linecap="butt"
                stroke-linejoin="miter"
              >
                <circle r="28" cx="30" cy="30" />
              </svg>
            </a-select-option>
          </a-select>
        </a-input-group>
      </a-tooltip>
    </template>

    <a-tooltip title="线条颜色">
      <div v-show="editableRef" class="pickr-wrapper">
        <div id="pickr-instance"></div>
      </div>
    </a-tooltip>

    <a-tooltip title="固定工具">
      <a-button
        class="middle-btn"
        shape="circle"
        :disabled="!editableRef"
        @click="stableRef = !stableRef"
        @mouseenter="handleShowEditOptions"
      >
        <template #icon><tool-outlined /></template>
      </a-button>
    </a-tooltip>

    <template v-if="editShowRef">
      <a-tooltip title="直线">
        <a-button-group>
          <a-button
            :class="[controller.getState() === CanvasOption.DrawLine && 'actived']"
            @click="() => handleChangeOptionState(CanvasOption.DrawLine)"
          >
            <minus-outlined />
          </a-button>
        </a-button-group>
      </a-tooltip>
      <a-tooltip title="圆">
        <a-button
          :class="[controller.getState() === CanvasOption.DrawCircle && 'actived']"
          @click="() => handleChangeOptionState(CanvasOption.DrawCircle)"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            class="anticon"
            stroke-width="1"
            stroke-linecap="butt"
            stroke-linejoin="miter"
          >
            <circle r="6" cx="10" cy="10" />
          </svg>
        </a-button>
      </a-tooltip>
      <a-tooltip title="矩形">
        <a-button
          :class="[controller.getState() === CanvasOption.DrawRect && 'actived']"
          @click="() => handleChangeOptionState(CanvasOption.DrawRect)"
        >
          <svg
            viewBox="0 0 30 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            class="anticon"
            stroke-width="1"
            stroke-linecap="butt"
            stroke-linejoin="miter"
          >
            <rect x="5" y="6" width="18" height="18" />
          </svg>
        </a-button>
      </a-tooltip>
      <a-tooltip title="撤销 (Ctrl+Z)">
        <a-button @click="emitCanvasUndoEvent">
          <undo-outlined />
        </a-button>
      </a-tooltip>
      <a-tooltip title="重做 (Ctrl+Y))">
        <a-button @click="emitCanvasRedoEvent">
          <redo-outlined />
        </a-button>
      </a-tooltip>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { useEditorConfig } from '@/store/modules/editor-config';
  import controller from '../common/canvas-state-controller';
  import { emitCanvasUndoEvent, emitCanvasRedoEvent } from '../common/event';
  import { computed, onMounted, ref } from 'vue';
  import {
    EditFilled,
    HighlightOutlined,
    RedoOutlined,
    UndoOutlined,
    MinusOutlined,
    ToolOutlined,
  } from '@ant-design/icons-vue';
  import { useColorPicker } from '@/hooks/useColorPicker';
  import { CanvasOption } from '../common/types';

  function handleChangeOptionState(state: CanvasOption) {
    controller.setState(state);
  }

  const config = useEditorConfig();

  const editableRef = computed(() => {
    if (controller.isDrawing()) {
      editShowRef.value = true;
      stableRef.value = true;
      return true;
    } else {
      editShowRef.value = false;
      stableRef.value = false;
      return false;
    }
  });
  const editShowRef = ref(false);
  const stableRef = ref(false);
  let hideEditOptions: any = null;
  function handleShowEditOptions() {
    if (editableRef.value) {
      clearTimeout(hideEditOptions);
      editShowRef.value = true;
    }
  }
  function handleHiddenEditOptions() {
    if (!stableRef.value) {
      hideEditOptions = setTimeout(() => {
        editShowRef.value = false;
      }, 200);
    }
  }

  const configRef = useEditorConfig();
  const pickrInstance = useColorPicker('.edit-options #pickr-instance');
  onMounted(() => {
    pickrInstance.init();
    pickrInstance.on('save', (color) => {
      configRef.setColor(color.toRGBA().toString());
    });
  });
</script>

<style lang="less">
  .is-local {
    .edit-options {
      top: 114px;
    }
  }
  .edit-options {
    display: flex;
    justify-content: space-around;
    position: fixed;
    top: 84px;
    left: 600px;
    width: 420px;
    padding: 5px;
    z-index: 101;
    background-color: transparent;
    transition: all 0.2s ease;
    overflow: hidden;

    &.small {
      width: 100px;
      left: 720px;
      .pickr-wrapper {
        visibility: hidden;
      }
    }
    .pcr-button {
      transition-duration: 0s !important;
    }
    .ant-btn {
      font-size: 12px;
      width: 32px;
      height: 32px;
      padding: 0 4px;
    }
    .ant-input-group {
      width: auto;
    }
    .ant-btn-group .button-select {
      font-size: 12px;
      width: 50px;
      height: 32px;
      border-radius: 0 5px 5px 0;
    }
    .ant-btn-circle {
      border-radius: 50%;
    }
    button.middle-btn {
      width: 40px;
      height: 40px;
      background-color: rgb(50, 50, 50);
      &[disabled] {
        color: rgba(255, 255, 255, 0.3);
        background: rgba(50, 50, 50, 0.3);
      }
    }
  }
</style>
