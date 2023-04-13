<template>
  <a-row class="option-group area-options" @click.stop>
    <a-col class="row-label" :span="4">
      <span class="group-label">区域： </span>
    </a-col>
    <a-col :span="20">
      <a-input type="text" placeholder="区域标识" v-model="areaNameRef"></a-input>
    </a-col>
    <a-col :span="4" :offset="4">
      <a-button
        type="primary"
        :disabled="controller.isDrawingArea()"
        @click="handleStartDrawingArea"
      >
        <icon-plus />
        新增
      </a-button>
    </a-col>
    <a-col :span="4">
      <a-button
        @click="handleStartEditArea"
        :disabled="!controller.getCurrentArea() || controller.isDrawingArea()"
      >
        <icon-edit />
        编辑
      </a-button>
    </a-col>
    <a-col :span="4">
      <a-button :disabled="!controller.isDrawingArea()" @click="handleEndDrawingArea(true)">
        <icon-check />
        完成
      </a-button>
    </a-col>
    <a-col :span="4">
      <a-button :disabled="!controller.isDrawingArea()" @click="handleEndDrawingArea(false)">
        <icon-close />
        取消
      </a-button>
    </a-col>
    <a-col :span="4">
      <a-button
        status="danger"
        @click="emitDeleteAreaEvent"
        :disabled="!controller.getCurrentArea()"
      >
        <icon-delete />
        删除
      </a-button>
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import message from '@arco-design/web-vue/es/message';
  import controller from '../common/canvas-state-controller';
  import { emitEditAreaEvent, emitDeleteAreaEvent } from '../common/event';
  import { checkFileName } from '@/utils/file';

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
    controller.startDrawingArea();
  }
  function handleEndDrawingArea(complete: boolean) {
    if (complete && !areaNameRef.value.length) {
      message.warning('请填写区域标识！');
      return;
    }
    if (!checkFileName(areaNameRef.value)) {
      message.warning('格式错误！区域标识只支持字母、数字、下划线！');
      return;
    }
    if (controller.getCurrentArea() == null) {
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
    controller.startDrawingArea();
    setTimeout(() => {
      emitEditAreaEvent();
    }, 50);
  }
</script>

<style lang="less" scoped>
  .area-options button {
    font-size: 12px;
    width: 50px;
    height: 32px;
    padding: 0 4px;
  }
</style>
