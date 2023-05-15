<template>
  <a-row class="option-group edit-options">
    <a-col class="row-label" :span="4">
      <span class="group-label">工具： </span>
    </a-col>
    <a-col :span="3">
      <a-tooltip content="画笔">
        <a-button
          :class="[controller.getState() === CanvasOption.FollowMouse && 'actived']"
          @click="() => handleChangeOptionState(CanvasOption.FollowMouse)"
          :disabled="!editableRef"
        >
          <icon-pen-fill />
        </a-button>
      </a-tooltip>
    </a-col>
    <a-col :span="7">
      <a-button-group>
        <a-tooltip content="橡皮">
          <a-button
            :class="[controller.getState() === CanvasOption.FollowMouseClear && 'actived']"
            @click="() => handleChangeOptionState(CanvasOption.FollowMouseClear)"
            :disabled="!editableRef"
          >
            <icon-eraser />
          </a-button>
        </a-tooltip>
        <a-select
          class="button-select"
          :class="[controller.getState() === CanvasOption.FollowMouseClear && 'actived']"
          :default-value="config.getEraseSize"
          @change="(val) => config.setEraseSize(Number(val))"
          :disabled="!editableRef"
        >
          <a-option :value="5">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              stroke="currentColor"
              class="arco-icon arco-icon-oblique-line"
              stroke-width="4"
              stroke-linecap="butt"
              stroke-linejoin="miter"
            >
              <circle r="12" cx="24" cy="24" />
            </svg>
          </a-option>
          <a-option :value="10">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              stroke="currentColor"
              class="arco-icon arco-icon-oblique-line"
              stroke-width="4"
              stroke-linecap="butt"
              stroke-linejoin="miter"
            >
              <circle r="20" cx="24" cy="24" />
            </svg>
          </a-option>
          <a-option :value="15">
            <svg
              viewBox="0 0 60 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              stroke="currentColor"
              class="arco-icon arco-icon-oblique-line"
              stroke-width="4"
              stroke-linecap="butt"
              stroke-linejoin="miter"
            >
              <circle r="28" cx="30" cy="30" />
            </svg>
          </a-option>
        </a-select>
      </a-button-group>
    </a-col>
    <a-col :span="3">
      <a-tooltip content="撤销">
        <a-button @click="emitCanvasUndoEvent" :disabled="!editableRef">
          <icon-undo />
        </a-button>
      </a-tooltip>
    </a-col>
    <a-col :span="3">
      <a-tooltip content="还原">
        <a-button @click="emitCanvasRedoEvent" :disabled="!editableRef">
          <icon-redo />
        </a-button>
      </a-tooltip>
    </a-col>
  </a-row>
  <a-row class="option-group edit-options">
    <a-col class="row-label" :span="4">
      <span class="group-label">形状： </span>
    </a-col>
    <a-col :span="3">
      <a-tooltip content="直线">
        <a-button
          :class="[controller.getState() === CanvasOption.DrawLine && 'actived']"
          @click="() => handleChangeOptionState(CanvasOption.DrawLine)"
          :disabled="!editableRef"
        >
          <icon-oblique-line />
        </a-button>
      </a-tooltip>
    </a-col>
    <a-col :span="3">
      <a-tooltip content="圆">
        <a-button
          :class="[controller.getState() === CanvasOption.DrawCircle && 'actived']"
          @click="() => handleChangeOptionState(CanvasOption.DrawCircle)"
          :disabled="!editableRef"
        >
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            class="arco-icon arco-icon-oblique-line"
            stroke-width="4"
            stroke-linecap="butt"
            stroke-linejoin="miter"
          >
            <circle r="23" cx="24" cy="24" />
          </svg>
        </a-button>
      </a-tooltip>
    </a-col>
    <a-col :span="3">
      <a-tooltip content="矩形">
        <a-button
          :class="[controller.getState() === CanvasOption.DrawRect && 'actived']"
          @click="() => handleChangeOptionState(CanvasOption.DrawRect)"
          :disabled="!editableRef"
        >
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            class="arco-icon arco-icon-oblique-line"
            stroke-width="5"
            stroke-linecap="butt"
            stroke-linejoin="miter"
          >
            <rect width="48" height="48" />
          </svg>
        </a-button>
      </a-tooltip>
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
  import { useEditorConfig } from '@/store/modules/editor-config';
  import controller, { CanvasOption } from '../common/canvas-state-controller';
  import { emitCanvasUndoEvent, emitCanvasRedoEvent } from '../common/event';
  import { computed } from 'vue';

  function handleChangeOptionState(state: CanvasOption) {
    controller.setState(state);
  }

  const config = useEditorConfig();

  const editableRef = computed(() => controller.isDrawingArea());
</script>

<style lang="less">
  .edit-options {
    height: 60px;
    button.arco-btn {
      font-size: 12px;
      width: 40px;
      height: 32px;
      padding: 0 4px;
    }
    .arco-btn-group .button-select {
      font-size: 12px;
      width: 50px;
      height: 32px;
      padding: 0 4px;
      border-radius: 0 5px 5px 0;
    }
  }
</style>
