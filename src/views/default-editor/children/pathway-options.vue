<template>
  <a-row class="option-group pathway-options" @click.stop>
    <a-col class="row-label" :span="6">
      <span class="group-label">路径标识 </span>
    </a-col>
    <a-col :span="18">
      <a-input type="text" placeholder="请填写英文字母、数字和下划线" v-model:value="pathwayNameRef"></a-input>
    </a-col>
    <a-col class="row-label" :span="6">
      <span class="group-label">路径类型 </span>
    </a-col>
    <a-col :span="18">
      <a-select
        :value="pathwayTypeRef"
        mode="tags"
        style="width: 100%"
        placeholder="选择一个已有类型或创建一个新类型"
        :options="pathwayTypeOptionsRef"
        @change="(val) => handleTypeChange(val)"
      ></a-select>
    </a-col>
    <a-col :span="4" :offset="2">
      <a-button type="primary" :disabled="addBtnDisabled" @click="handleStartDrawingPathway">
        <template #icon><plus-outlined /> </template>新增
      </a-button>
    </a-col>
    <a-col :span="4">
      <a-button @click="handleStartEditPathway" :disabled="editBtnDisabled">
        <template #icon><edit-outlined /> </template>编辑
      </a-button>
    </a-col>
    <a-col :span="4">
      <a-button class="success-item" :disabled="!controller.isDrawing()" @click="handleEndDrawingPathway(true)">
        <template #icon><check-outlined /> </template>完成
      </a-button>
    </a-col>
    <a-col :span="4">
      <a-button class="default-item" :disabled="!controller.isDrawing()" @click="handleEndDrawingPathway(false)">
        <template #icon><close-outlined /> </template>取消
      </a-button>
    </a-col>
    <a-col :span="4">
      <a-button status="danger" @click="handleDeletePathway" :disabled="!controller.isSelectedPathway()">
        <template #icon><delete-outlined /> </template>删除
      </a-button>
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { message } from 'ant-design-vue';
  import controller from '../common/canvas-state-controller';
  import { emitEditPathwayEvent, emitDeletePathwayEvent } from '../common/event';
  import { checkFileName } from '@/utils/file';
  import Modal from 'ant-design-vue/lib/modal';
  import { PlusOutlined, EditOutlined, CheckOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons-vue';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import { CanvasOption, DrawState } from '../common/types';

  const emit = defineEmits<{
    (e: 'end-edit-pathway', name: string, type: string, complete: boolean): void;
  }>();

  const canvasState = useCanvasState();

  const pathwayNameRef = ref('');
  const pathwayTypeRef = ref<string[]>([]);
  const pathwayTypeOptionsRef = computed(() => {
    const options: string[] = [];
    canvasState.getLayers.forEach((layer) => {
      layer.pathways.forEach((pathway) => {
        if (pathway.type && !options.includes(pathway.type)) {
          options.push(pathway.type);
        }
      });
    });
    return options.map((val) => ({ value: val }));
  });
  function handleTypeChange(val) {
    pathwayTypeRef.value = val.slice(-1);
  }
  function handleStartDrawingPathway() {
    if (!pathwayNameRef.value.length) {
      message.warning('请填写路径标识！');
      return;
    }
    if (!checkFileName(pathwayNameRef.value)) {
      message.warning('格式错误！路径标识只支持字母、数字、下划线！');
      return;
    }
    controller.startDrawing(DrawState.PathwayAdd);
  }
  function handleEndDrawingPathway(complete: boolean) {
    if (complete && !pathwayNameRef.value.length) {
      message.warning('请填写路径标识！');
      return;
    }
    if (complete && !checkFileName(pathwayNameRef.value)) {
      message.warning('格式错误！路径标识只支持字母、数字、下划线！');
      return;
    }
    // 编辑、新增逻辑不同
    controller.setState(CanvasOption.None);
    setTimeout(() => {
      emit('end-edit-pathway', pathwayNameRef.value, pathwayTypeRef.value[0], complete);
    }, 100);
  }

  function handleStartEditPathway() {
    const pathway = controller.getCurrentPathway();
    pathwayNameRef.value = pathway?.getName() || '';
    pathwayTypeRef.value = [pathway?.type || ''];
    controller.startDrawing(DrawState.PathwayEdit);
    setTimeout(() => {
      emitEditPathwayEvent();
    }, 30);
  }

  function handleDeletePathway() {
    const pathway = controller.getCurrentPathway()?.getName();
    Modal.confirm({
      title: '提醒',
      content: `删除当前选中的路径？[${pathway}]`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        emitDeletePathwayEvent();
      },
    });
  }

  const addBtnDisabled = computed(
    () => !controller.getCurrentLayer() || controller.getCurrentLayer()?.lock || controller.isDrawing(),
  );

  const editBtnDisabled = computed(() => !controller.getCurrentPathway() || controller.isDrawing());
</script>

<style lang="less">
  .pathway-options {
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
