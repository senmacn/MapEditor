<template>
  <div class="thin-option">
    <a-divider></a-divider>
    <a-tooltip content="图层">
      <a-dropdown trigger="click" popup-container=".thin-option" @select="">
        <a-button type="text">
          <icon-layers />
        </a-button>
        <template #content>
          <a-doption class="layer-item" v-for="layer in layersRef" :key="layer.uuid">
            {{ layer.name }}
          </a-doption>
        </template>
      </a-dropdown>
    </a-tooltip>
    <a-divider></a-divider>

    <a-tooltip content="新增">
      <a-button type="text" :disabled="controller.isDrawingArea()" @click="handleStartDrawingArea">
        <icon-plus />
      </a-button>
    </a-tooltip>
    <a-tooltip content="编辑">
      <a-button type="text" :disabled="editBtnDisabled" @click="handleStartEditArea">
        <icon-edit />
      </a-button>
    </a-tooltip>
    <a-tooltip content="完成">
      <a-button
        type="text"
        :disabled="!controller.isDrawingArea()"
        @click="handleEndDrawingArea(true)"
      >
        <icon-check />
      </a-button>
    </a-tooltip>
    <a-tooltip content="取消">
      <a-button
        type="text"
        :disabled="!controller.isDrawingArea()"
        @click="handleEndDrawingArea(false)"
      >
        <icon-close />
      </a-button>
    </a-tooltip>
    <a-tooltip content="删除">
      <a-button
        type="text"
        status="danger"
        :disabled="!controller.getCurrentArea()"
        @click="handleDeleteArea"
      >
        <icon-delete />
      </a-button>
    </a-tooltip>

    <a-divider></a-divider>

    <a-tooltip content="画笔">
      <a-button
        type="text"
        :class="[controller.getState() === CanvasOption.FollowMouse && 'actived']"
        @click="() => handleChangeOptionState(CanvasOption.FollowMouse)"
        :disabled="!controller.isDrawingArea()"
      >
        <icon-pen-fill />
      </a-button>
    </a-tooltip>
    <a-tooltip content="橡皮">
      <a-button
        type="text"
        :class="[controller.getState() === CanvasOption.FollowMouseClear && 'actived']"
        @click="() => handleChangeOptionState(CanvasOption.FollowMouseClear)"
        :disabled="!controller.isDrawingArea()"
      >
        <icon-eraser />
      </a-button>
    </a-tooltip>
    <a-tooltip content="撤销">
      <a-button type="text" @click="emitCanvasUndoEvent" :disabled="!controller.isDrawingArea()">
        <icon-undo />
      </a-button>
    </a-tooltip>
    <a-tooltip content="还原">
      <a-button type="text" @click="emitCanvasRedoEvent" :disabled="!controller.isDrawingArea()">
        <icon-redo />
      </a-button>
    </a-tooltip>

    <a-divider></a-divider>

    <a-tooltip content="直线">
      <a-button
        type="text"
        :class="[controller.getState() === CanvasOption.DrawLine && 'actived']"
        @click="() => handleChangeOptionState(CanvasOption.DrawLine)"
        :disabled="!controller.isDrawingArea()"
      >
        <icon-oblique-line />
      </a-button>
    </a-tooltip>

    <a-tooltip content="圆">
      <a-button
        type="text"
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

    <a-tooltip content="矩形">
      <a-button
        type="text"
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

    <a-divider></a-divider>

    <a-tooltip content="设置">
      <a-button type="text">
        <icon-settings />
      </a-button>
    </a-tooltip>
  </div>
</template>

<script setup lang="ts">
  import { Ref, computed, inject, ref } from 'vue';
  import message from '@arco-design/web-vue/es/message';
  import { emitEditAreaEvent, emitDeleteAreaEvent } from './common/event';
  import { checkFileName } from '@/utils/file';
  import { isNull } from '@/utils/is';
  import modal from '@arco-design/web-vue/es/modal';
  import controller, { CanvasOption } from './common/canvas-state-controller';
  import { emitCanvasUndoEvent, emitCanvasRedoEvent } from './common/event';
  import { Layer } from './common/types';

  const layersRef: Ref<Layer[]> = inject('layers', [] as any);

  /**
   * area-options
   */
  const emit = defineEmits<{
    (e: 'end-edit-area', name: string, complete: boolean): void;
  }>();

  const areaNameRef = ref('');
  function handleStartDrawingArea() {
    if (!areaNameRef.value.length) {
      message.warning('请填写区域标识！');
      return;
    }
    if (!checkFileName(areaNameRef.value)) {
      message.warning('格式错误！区域标识只支持字母、数字、下划线！');
      return;
    }
    controller.startDrawingArea(true);
  }
  function handleEndDrawingArea(complete: boolean) {
    if (complete && !areaNameRef.value.length) {
      message.warning('请填写区域标识！');
      return;
    }
    if (complete && !checkFileName(areaNameRef.value)) {
      message.warning('格式错误！区域标识只支持字母、数字和 . _ - 等符号！');
      return;
    }
    // 编辑、新增逻辑不同
    if (!controller.isEditingArea()) {
      emit('end-edit-area', areaNameRef.value, complete);
      areaNameRef.value = '';
    } else {
      complete && emitDeleteAreaEvent();
      setTimeout(() => {
        emit('end-edit-area', areaNameRef.value, complete);
        areaNameRef.value = '';
      }, 50);
    }
  }

  function handleStartEditArea() {
    areaNameRef.value = controller.getCurrentArea()?.getName() || '';
    controller.startDrawingArea(false);
    setTimeout(() => {
      emitEditAreaEvent();
    }, 30);
  }

  function handleDeleteArea() {
    modal.confirm({
      title: '确认',
      content: '删除当前选中的区域【' + controller.getCurrentArea()?.getName() + '】？',
      onOk: () => {
        emitDeleteAreaEvent();
      },
    });
  }

  const editBtnDisabled = computed(
    () => isNull(controller.getCurrentArea()) || controller.isDrawingArea(),
  );

  /**
   * edit-options
   */
  function handleChangeOptionState(state: CanvasOption) {
    controller.setState(state);
  }
</script>

<style lang="less">
  .thin-option {
    position: absolute;
    top: 0;
    right: 100px;
    width: 50px;
    height: 100%;
    background-color: rgb(51, 51, 51);
    .arco-btn {
      width: 100%;
    }
    .arco-divider {
      margin: 10px 0;
    }
    .arco-trigger-popup-wrapper {
      transform: translate(-50px, -40px);
    }
  }
</style>
