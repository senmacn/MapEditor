<template>
  <a-dropdown
    @click.prevent
    :trigger="['click']"
    overlayClassName="navbar-menu-wrapper"
    :disabled="!editableRef"
  >
    <div class="nav-item"> 编辑 </div>
    <template #overlay>
      <a-menu>
        <a-menu-item key="0">
          <div
            class="inner-content"
            @click="() => handleChangeOptionState(CanvasOption.FollowMouse)"
          >
            铅笔
          </div>
        </a-menu-item>
        <a-menu-item key="1">
          <div class="inner-content" @click="() => handleChangeOptionState(CanvasOption.Pen)">
            钢笔
          </div>
        </a-menu-item>
        <a-sub-menu key="2" title="橡皮">
          <a-menu-item key="2-0">
            <div class="inner-content" @click="() => handleUseEraser(6)"> 小 </div>
          </a-menu-item>
          <a-menu-item key="2-1">
            <div class="inner-content" @click="() => handleUseEraser(12)"> 中 </div>
          </a-menu-item>
          <a-menu-item key="2-2">
            <div class="inner-content" @click="() => handleUseEraser(18)"> 大 </div>
          </a-menu-item>
        </a-sub-menu>

        <a-divider></a-divider>

        <a-menu-item key="3">
          <div class="inner-content" @click="() => handleChangeOptionState(CanvasOption.DrawLine)">
            直线
          </div>
        </a-menu-item>
        <a-menu-item key="4">
          <div
            class="inner-content"
            @click="() => handleChangeOptionState(CanvasOption.DrawCircle)"
          >
            圆
          </div>
        </a-menu-item>
        <a-menu-item key="5">
          <div class="inner-content" @click="() => handleChangeOptionState(CanvasOption.DrawRect)">
            矩形
          </div>
        </a-menu-item>

        <a-divider></a-divider>

        <a-menu-item key="6">
          <div class="inner-content" @click="emitCanvasUndoEvent"> 撤销 (Ctrl+Z) </div>
        </a-menu-item>
        <a-menu-item key="7">
          <div class="inner-content" @click="emitCanvasRedoEvent"> 重做 (Ctrl+Y) </div>
        </a-menu-item>
        <a-menu-item key="0">
          <div class="inner-content" @click="() => handleChangeOptionState(CanvasOption.None)">
            取消 (Esc)
          </div>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
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

  function handleUseEraser(size: number) {
    config.setEraseSize(size);
    controller.setState(CanvasOption.FollowMouseClear);
  }
</script>

<style lang="less"></style>
