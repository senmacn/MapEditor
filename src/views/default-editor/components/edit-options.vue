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
          :disabled="!controller.isDrawingArea()"
        >
          <icon-edit />
        </a-button>
      </a-tooltip>
    </a-col>
    <a-col :span="3">
      <a-tooltip content="橡皮">
        <a-button
          :class="[controller.getState() === CanvasOption.FollowMouseClear && 'actived']"
          @click="() => handleChangeOptionState(CanvasOption.FollowMouseClear)"
          :disabled="!controller.isDrawingArea()"
        >
          <icon-eraser />
        </a-button>
      </a-tooltip>
    </a-col>
    <a-col :span="3">
      <a-tooltip content="撤销">
        <a-button @click="emitCanvasUndoEvent" :disabled="!controller.isDrawingArea()">
          <icon-undo />
        </a-button>
      </a-tooltip>
    </a-col>
    <a-col :span="3">
      <a-tooltip content="还原">
        <a-button @click="emitCanvasRedoEvent" :disabled="!controller.isDrawingArea()">
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
          :disabled="!controller.isDrawingArea()"
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
          :disabled="!controller.isDrawingArea()"
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
          :disabled="!controller.isDrawingArea()"
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
  import controller, { CanvasOption } from '../common/canvas-state-controller';
  import { emitCanvasUndoEvent, emitCanvasRedoEvent } from '../common/event';

  function handleChangeOptionState(state: CanvasOption) {
    controller.setState(state);
  }
</script>

<style scoped>
  .edit-options {
    height: 60px;
  }
  .edit-options button {
    font-size: 12px;
    width: 40px;
    height: 32px;
    padding: 0 4px;
  }
</style>
