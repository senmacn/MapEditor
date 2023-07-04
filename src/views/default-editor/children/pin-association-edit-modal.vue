<template>
  <a-modal
    class="pin-edit-modal"
    :width="500"
    :visible="visibleRef"
    :closable="false"
    :onOk="handleOk"
    :onCancel="handleCancel"
    :title="null"
  >
    <div class="modal-title">地图钉关联</div>
    <div class="modal-content">
      <a-form :labelCol="{ span: 4 }" :wrapperCol="{ span: 20 }" labelAlign="right">
        <a-form-item label="地图钉">
          <a-select :options="optionsRef" @change="handleSelect"></a-select>
        </a-form-item>
        <a-form-item label="关系">
          <a-radio-group v-model:value="dataRef.type">
            <a-radio
              :value="type"
              v-for="(type, index) in Object.values(AssociationType)"
              :key="index"
            >
              {{ type }}
            </a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { PinAssociation, AssociationType } from '../draw-element/type';
  import { useCanvasState } from '@/store/modules/canvas-state';

  const emits = defineEmits<{
    (e: 'edit', data: PinAssociation): void;
  }>();

  const visibleRef = ref(false);
  const dataRef = ref({} as PinAssociation);

  function handleOk() {
    if (!Object.values(dataRef.value).every((v) => !!v)) {
      return;
    }
    visibleRef.value = false;
    emits('edit', dataRef.value);
  }

  function handleCancel() {
    visibleRef.value = false;
  }

  const state = useCanvasState();
  const optionsRef = ref<any[]>([]);

  function handleSelect(_, option) {
    dataRef.value.name = option.label;
    dataRef.value.uuid = option.value;
  }

  function setData(data?: PinAssociation) {
    visibleRef.value = true;

    const _options: any[] = [];
    for (let pin of state.getPinMap.values()) {
      if (dataRef.value.uuid && dataRef.value.uuid === pin.getUuid()) {
        // 排除自己
        continue;
      }
      _options.push({
        label: pin.getName(),
        value: pin.getUuid(),
      });
    }
    optionsRef.value = _options;

    if (data) {
      dataRef.value = data;
    } else {
      dataRef.value = {} as PinAssociation;
    }
  }
  defineExpose({
    setData,
  });
</script>

<style lang="less">
  .pin-edit-modal {
    .ant-radio-wrapper {
      font-size: 12px;
    }
  }
</style>
