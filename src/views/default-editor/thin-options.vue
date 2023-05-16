<template>
  <div class="thin-option">
    <a-divider></a-divider>
    <a-popover trigger="hover" position="left">
      <a-button type="text">
        <layers-outlined />
      </a-button>
      <template #content>
        {{ hotLayerRef?.name }}
      </template>
    </a-popover>
    <a-divider></a-divider>

    <a-popover trigger="hover" position="left">
      <a-button type="text" :disabled="controller.isDrawingArea()">
        <plus-outlined />
      </a-button>
      <template #content>
        <div class="thin-option-add">
          <a-input placeholder="区域标识" v-model:value="areaNameRef"></a-input>
          <a-button type="primary" @click="handleStartDrawingArea">新增</a-button>
        </div>
      </template>
    </a-popover>
    <a-tooltip title="编辑">
      <a-button type="text" :disabled="editBtnDisabled" @click="handleStartEditArea">
        <edit-outlined />
      </a-button>
    </a-tooltip>
    <a-tooltip title="完成">
      <a-button
        type="text"
        :disabled="!controller.isDrawingArea()"
        @click="handleEndDrawingArea(true)"
      >
        <check-outlined />
      </a-button>
    </a-tooltip>
    <a-tooltip title="取消">
      <a-button
        type="text"
        :disabled="!controller.isDrawingArea()"
        @click="handleEndDrawingArea(false)"
      >
        <close-outlined />
      </a-button>
    </a-tooltip>
    <a-tooltip title="删除">
      <a-button
        type="text"
        status="danger"
        :disabled="!controller.getCurrentArea()"
        @click="handleDeleteArea"
      >
        <delete-outlined />
      </a-button>
    </a-tooltip>

    <a-divider></a-divider>

    <a-tooltip title="画笔">
      <a-button
        type="text"
        class="edit-btn"
        :class="[controller.getState() === CanvasOption.FollowMouse && 'actived']"
        @click="() => handleChangeOptionState(CanvasOption.FollowMouse)"
        :disabled="!editableRef"
      >
        <edit-filled />
      </a-button>
    </a-tooltip>
    <a-tooltip title="橡皮">
      <a-button
        type="text"
        class="edit-btn"
        :class="[controller.getState() === CanvasOption.FollowMouseClear && 'actived']"
        @click="() => handleChangeOptionState(CanvasOption.FollowMouseClear)"
        :disabled="!editableRef"
      >
        <edit-filled />
      </a-button>
    </a-tooltip>
    <a-tooltip title="撤销">
      <a-button type="text" class="edit-btn" @click="emitCanvasUndoEvent" :disabled="!editableRef">
        <undo-outlined />
      </a-button>
    </a-tooltip>
    <a-tooltip title="还原">
      <a-button type="text" class="edit-btn" @click="emitCanvasRedoEvent" :disabled="!editableRef">
        <redo-outlined />
      </a-button>
    </a-tooltip>

    <a-divider></a-divider>

    <a-tooltip title="直线">
      <a-button
        type="text"
        class="edit-btn"
        :class="[controller.getState() === CanvasOption.DrawLine && 'actived']"
        @click="() => handleChangeOptionState(CanvasOption.DrawLine)"
        :disabled="!editableRef"
      >
        <minus-outlined />
      </a-button>
    </a-tooltip>

    <a-tooltip title="圆">
      <a-button
        type="text"
        class="edit-btn"
        :class="[controller.getState() === CanvasOption.DrawCircle && 'actived']"
        @click="() => handleChangeOptionState(CanvasOption.DrawCircle)"
        :disabled="!editableRef"
      >
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
          <circle r="23" cx="24" cy="24" />
        </svg>
      </a-button>
    </a-tooltip>

    <a-tooltip title="矩形">
      <a-button
        type="text"
        class="edit-btn"
        :class="[controller.getState() === CanvasOption.DrawRect && 'actived']"
        @click="() => handleChangeOptionState(CanvasOption.DrawRect)"
        :disabled="!editableRef"
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="currentColor"
          class="anticon"
          stroke-width="5"
          stroke-linecap="butt"
          stroke-linejoin="miter"
        >
          <rect width="48" height="48" />
        </svg>
      </a-button>
    </a-tooltip>

    <a-divider></a-divider>

    <a-popover trigger="hover" position="left">
      <a-button type="text">
        <setting-outlined />
      </a-button>
      <template #content>
        <div class="thin-options-config">
          <edit-config></edit-config>
        </div>
      </template>
    </a-popover>
  </div>
</template>

<script setup lang="ts">
  import { Ref, computed, inject, ref } from 'vue';
  import EditConfig from './children/edit-config.vue';
  import { emitEditAreaEvent, emitDeleteAreaEvent } from './common/event';
  import { isNull } from '@/utils/is';
  import modal from 'ant-design-vue/lib/modal';
  import controller, { CanvasOption } from './common/canvas-state-controller';
  import { emitCanvasUndoEvent, emitCanvasRedoEvent } from './common/event';
  import { Layer } from './common/types';
  import { checkAreaName } from './common/util';
  import {
    PlusOutlined,
    EditOutlined,
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
    SettingOutlined,
    UndoOutlined,
    RedoOutlined,
    EditFilled,
    MinusOutlined,
  } from '@ant-design/icons-vue';

  const layersRef: Ref<Layer[]> = inject('layers', [] as any);
  const hotLayerRef = computed(() => {
    for (let index = layersRef.value.length - 1; index >= 0; index--) {
      const element = layersRef.value[index];
      if (element.hot) {
        return element;
      }
    }
  });

  const editableRef = computed(() => controller.isDrawingArea());

  /**
   * area-options
   */
  const emit = defineEmits<{
    (e: 'end-edit-area', name: string, complete: boolean): void;
  }>();

  const areaNameRef = ref('');
  function handleStartDrawingArea() {
    if (!checkAreaName(areaNameRef.value)) return;
    controller.startDrawingArea(true);
  }
  function handleEndDrawingArea(complete: boolean) {
    if (complete && !checkAreaName(areaNameRef.value)) return;
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
    .ant-btn {
      width: 100%;
    }
    .ant-divider {
      margin: 10px 0;
    }
    button.edit-btn {
      color: white;
    }
    button.edit-btn.ant-btn-disabled {
      color: @color-text-4;
    }
  }
  .thin-option-add {
    display: flex;
  }
  .thin-options-config {
    width: 280px;
    padding: 30px 10px 0;
  }
</style>
