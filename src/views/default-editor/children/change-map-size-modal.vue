<template>
  <a-modal :visible="visible" @cancel="emit('close')" @ok="handleChange" :closable="false">
    <div class="modal-title">尺寸设置</div>
    <div class="modal-content">
      <div class="map-size">
        <span>比例尺:</span>
        <a-input v-model:value="scaleRef" suffix="cm/px">
          <template #append> px </template></a-input
        >
      </div>
      <div class="map-size">
        <span>偏移X:</span>
        <a-input v-model:value="offsetXRef"> <template #append> px </template></a-input>
      </div>
      <div class="map-size">
        <span>偏移Y:</span>
        <a-input v-model:value="offsetYRef"> <template #append> px </template></a-input>
      </div>
      <div class="map-size">
        <span>长度:</span>
        <a-input v-model:value="xRef"> <template #append> px </template></a-input>
      </div>
      <div class="map-size">
        <span>宽度:</span>
        <a-input v-model:value="yRef"> <template #append> px </template></a-input>
      </div>
      <div class="map-size">
        <span>全图长度：</span>
        <a-input v-model:value="allXRef"> <template #append> px </template></a-input>
      </div>
      <div class="map-size">
        <span>全图宽度:</span>
        <a-input v-model:value="allYRef"> <template #append> px </template></a-input>
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
  const scaleRef = ref();
  const offsetXRef = ref();
  const offsetYRef = ref();
  const xRef = ref();
  const yRef = ref();
  const allXRef = ref();
  const allYRef = ref();
  watch(
    () => props.visible,
    () => {
      if (props.visible) {
        scaleRef.value = String(configRef.size.scale);
        offsetXRef.value = String(configRef.size.offsetX);
        offsetYRef.value = String(configRef.size.offsetY);
        xRef.value = String(configRef.size.x);
        yRef.value = String(configRef.size.y);
        allXRef.value = String(configRef.size.allX);
        allYRef.value = String(configRef.size.allY);
      }
    },
  );

  function handleChange() {
    modal.confirm({
      title: '确认',
      content: '修改地图尺寸会导致页面更新！请确认操作！',
      onOk: () => {
        configRef.setSize({
          scale: scaleRef.value,
          offsetX: offsetXRef.value,
          offsetY: offsetYRef.value,
          x: xRef.value,
          y: yRef.value,
          allX: allXRef.value,
          allY: allYRef.value,
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
    border-bottom: 1px solid @color-modal-border;
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
