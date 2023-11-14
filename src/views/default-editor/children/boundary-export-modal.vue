<template>
  <a-modal class="boundary-export-modal" :width="500" :visible="visible" :closable="false" :footer="null">
    <div class="modal-title">导出边框数据</div>
    <div class="modal-content">
      <a-row>
        <a-col :span="6">导出间隔: {{ interval }}</a-col>
        <a-col :span="18">
          <a-slider v-model:value="interval" :max="10" :min="1"></a-slider>
        </a-col>
      </a-row>
      <a-row class="tip"> 导出间隔越小，导出的点越多，但兼容性会变差。 </a-row>
      <a-row class="tip"> 导出间隔加大时，对于边角的复杂曲线兼容性会更好。 </a-row>
      <a-row class="tip"> 如果导出的数据质量不佳，建议调高两档间隔试试。 </a-row>
      <a-divider></a-divider>
      <a-row>
        <a-col :span="12"> 用于策划观察边框 </a-col>
        <a-col :span="12">
          <a-button type="primary" @click="() => handleExport(true)">导出数据</a-button>
        </a-col>
      </a-row>
      <a-row>
        <a-col :span="12">用于生成碰撞检测</a-col>
        <a-col :span="12">
          <a-button type="primary" @click="() => handleExport(false)">导出数据</a-button>
        </a-col>
      </a-row>
    </div>
    <div class="ant-modal-footer">
      <a-button @click="emit('close')">关闭</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import { Modal, notification } from 'ant-design-vue';
  import { handleExportBoundary } from '../utils/boundary-export';
  import { ref } from 'vue';

  const emit = defineEmits<{
    (e: 'close'): void;
  }>();

  defineProps({
    visible: {
      type: Boolean,
      default: false,
    },
  });

  const interval = ref(2);

  function handleExport(exportType: boolean) {
    Modal.confirm({
      title: '区域边框数据导出',
      content: '导出位置将使用【坐标下载位置】，确认导出所有区域边框数据？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        notification.info({
          message: '导出数据',
          description: '区域边框数据的下载已在后台进行，请勿关闭编辑器！',
        });
        handleExportBoundary(interval.value, exportType);
      },
    });
  }
</script>

<style lang="less">
  .boundary-export-modal {
    .modal-content {
      padding: 36px 56px 56px;
      .title {
        font-weight: bold;
        font-size: 14px;
      }
    }
    .ant-col {
      line-height: 32px;
      margin-bottom: 25px;
    }
    .ant-slider-rail {
      background-color: rgb(149, 184, 255);
      &:hover {
        background-color: rgb(149, 184, 255);
      }
    }
    .ant-slider-track {
      background-color: rgb(149, 184, 255);
      &:hover {
        background-color: rgb(149, 184, 255);
      }
    }
    .tip {
      text-align: center;
      font-size: 12px;
    }
  }
</style>
