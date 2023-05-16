<template>
  <a-modal :visible="visible" @cancel="emit('close')" @ok="handleChange" :closable="false">
    <div class="modal-title">确认</div>
    <div class="modal-content">
      <div class="map-size">
        <span>长度:</span>
        <a-input v-model:value="xRef"> <template #append> px </template></a-input>
      </div>
      <div class="map-size">
        <span>宽度:</span>
        <a-input v-model:value="yRef"> <template #append> px </template></a-input>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import modal from 'ant-design-vue/lib/modal';
  import { useEditorConfig } from '@/store/modules/editor-config';

  const emit = defineEmits<{
    (e: 'close'): void;
  }>();

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false,
    },
  });

  const configRef = useEditorConfig();
  const xRef = ref();
  const yRef = ref();
  watch(
    () => props.visible,
    () => {
      if (props.visible) {
        xRef.value = String(configRef.size.x);
        yRef.value = String(configRef.size.y);
      }
    },
  );

  function handleChange() {
    modal.confirm({
      title: '确认',
      content: '修改地图尺寸会导致页面更新！请确认操作！',
      onOk: () => {
        configRef.setSize({
          x: xRef.value,
          y: yRef.value,
        });
        location.reload();
      },
    });
  }
</script>

<style lang="less">
  .ant-modal {
    border-radius: 4px;
    .ant-modal-body {
      padding: 0;
      border-radius: 4px;
    }
    .ant-modal-footer {
      padding: 8px 10px;
      button {
        width: 80px;
        height: 32px;
      }
    }
  }
  .modal-title {
    padding: 8px;
    border-bottom: 1px solid @color-border-2;
    background-color: @color-bg-2;
    text-align: center;
  }
  .modal-content {
    padding: 32px;
  }
  .map-size {
    display: flex;
    margin-bottom: 20px;
    > span:first-child {
      width: 120px;
      text-align: center;
    }
    .ant-input-wrapper {
      width: 250px;
    }
  }
</style>
