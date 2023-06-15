<template>
  <a-row class="option-group area-options" @click.stop>
    <a-col class="row-label" :span="6">
      <span class="group-label">区域名称 </span>
    </a-col>
    <a-col :span="18">
      <a-input
        type="text"
        placeholder="请填写英文字母、数字和下划线"
        v-model:value="areaNameRef"
      ></a-input>
    </a-col>
    <a-col class="row-label" :span="6">
      <span class="group-label">区域 ID </span>
    </a-col>
    <a-col :span="18">
      <a-input
        type="text"
        placeholder="请填写英文字母、数字和下划线"
        v-model:value="areaIDRef"
      ></a-input>
    </a-col>
    <a-col class="row-label" :span="6">
      <span class="group-label">区域类型 </span>
    </a-col>
    <a-col :span="18">
      <a-select
        :value="areaTypeRef"
        mode="tags"
        style="width: 100%"
        placeholder="选择一个已有类型或创建一个新类型"
        :options="[]"
        @change="(val) => handleTypeChange(val)"
      ></a-select>
    </a-col>
    <a-col :span="4" :offset="2">
      <a-button
        type="primary"
        :disabled="controller.isDrawingArea()"
        @click="handleStartDrawingArea"
      >
        <template #icon><plus-outlined /> </template>新增
      </a-button>
    </a-col>
    <a-col :span="4">
      <a-button @click="handleStartEditArea" :disabled="editBtnDisabled">
        <template #icon><edit-outlined /> </template>编辑
      </a-button>
    </a-col>
    <a-col :span="4">
      <a-button
        class="success-item"
        :disabled="!controller.isDrawingArea()"
        @click="handleEndDrawingArea(true)"
      >
        <template #icon><check-outlined /> </template>完成
      </a-button>
    </a-col>
    <a-col :span="4">
      <a-button
        class="default-item"
        :disabled="!controller.isDrawingArea()"
        @click="handleEndDrawingArea(false)"
      >
        <template #icon><close-outlined /> </template>取消
      </a-button>
    </a-col>
    <a-col :span="4">
      <a-button status="danger" @click="handleDeleteArea" :disabled="!controller.isSelectedArea()">
        <template #icon><delete-outlined /> </template>删除
      </a-button>
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { message } from 'ant-design-vue';
  import controller from '../common/canvas-state-controller';
  import { emitEditAreaEvent, emitDeleteAreaEvent } from '../common/event';
  import { checkFileName } from '@/utils/file';
  import modal from 'ant-design-vue/lib/modal';
  import {
    PlusOutlined,
    EditOutlined,
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
  } from '@ant-design/icons-vue';

  const emit = defineEmits<{
    (e: 'end-edit-area', name: string, complete: boolean): void;
  }>();

  const areaNameRef = ref('');
  const areaIDRef = ref('');
  const areaTypeRef = ref<string[]>([]);
  function handleTypeChange(val) {
    areaTypeRef.value = val.slice(-1);
  }
  function handleStartDrawingArea() {
    if (!areaNameRef.value.length || !areaIDRef.value.length) {
      message.warning('请填写区域类型和ID！');
      return;
    }
    if (!checkFileName(areaNameRef.value)) {
      message.warning('格式错误！区域标识只支持字母、数字、下划线！');
      return;
    }
    controller.startDrawingArea(true);
  }
  function handleEndDrawingArea(complete: boolean) {
    if (!areaNameRef.value.length || !areaIDRef.value.length) {
      message.warning('请填写区域类型和ID！');
      return;
    }
    if (complete && !checkFileName(areaNameRef.value)) {
      message.warning('格式错误！区域标识只支持字母、数字、下划线！');
      return;
    }
    // 编辑、新增逻辑不同
    if (!controller.isEditingArea()) {
      emit('end-edit-area', areaNameRef.value + '-' + areaIDRef.value, complete);
    } else {
      complete && emitDeleteAreaEvent();
      setTimeout(() => {
        emit('end-edit-area', areaNameRef.value + '-' + areaIDRef.value, complete);
      }, 50);
    }
  }

  function handleStartEditArea() {
    const area = controller.getCurrentAreas()[0];
    [areaNameRef.value, areaIDRef.value] = area?.getName().split('-') || '';
    areaTypeRef.value = area.type;
    controller.startDrawingArea(false);
    setTimeout(() => {
      emitEditAreaEvent();
    }, 30);
  }

  function handleDeleteArea() {
    modal.confirm({
      title: '确认',
      content: '删除当前选中的区域【' + controller.getCurrentAreas()[0]?.getName() + '】？',
      onOk: () => {
        emitDeleteAreaEvent();
      },
    });
  }

  const editBtnDisabled = computed(
    () => !controller.getCurrentAreas()[0] || controller.isDrawingArea(),
  );
</script>

<style lang="less">
  .area-options {
    button.ant-btn {
      font-size: 12px;
      width: 52px;
      height: 32px;
      padding: 0 2px;
    }
    .ant-btn > .anticon + span {
      margin-left: 0;
    }
  }
</style>
