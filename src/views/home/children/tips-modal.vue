<template>
  <a-modal
    class="tips-modal"
    :width="520"
    :visible="visibleRef"
    :closable="false"
    :on-cancel="handleCancel"
    :title="null"
    :footer="null"
  >
    <div class="modal-title">版本更新提醒</div>
    <div class="modal-content">
      <div>更新内容</div>
      <ul>
        <li>优化区域完成时的填充算法（预估加速230%），<b>不需要强制选中中心</b>。</li>
        <li>区域列表添加<b>【仅显示此项】</b>按钮，方便快速隐藏不相关内容。</li>
        <br />
        <li>路径导出修改为Y-X导出。</li>
        <li>路径导出增加自定义前后缀功能。</li>
      </ul>
    </div>
    <div class="ant-modal-footer">
      <a-button style="width: 240px" @click="handleCancel">了解，启动</a-button>
      <a-button style="width: 240px" @click="handleSkip">该版本不再提醒</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { version } from '../../../../package.json';

  const visibleRef = ref(false);

  function handleCancel() {
    visibleRef.value = false;
  }
  onMounted(() => {
    const localVersion = localStorage.getItem('version');
    const sessionSkip = sessionStorage.getItem('session-skip');
    const skip = localStorage.getItem('skip');
    if (localVersion !== version) {
      visibleRef.value = true;
      localStorage.removeItem('skip');
    }
    if (!skip && !sessionSkip) {
      visibleRef.value = true;
    }
    localStorage.setItem('version', version);
    sessionStorage.setItem('session-skip', 'true');
  });

  function handleSkip() {
    localStorage.setItem('skip', 'true');
    visibleRef.value = false;
  }
</script>

<style lang="less">
  .tips-modal {
    .modal-content {
      padding: 36px 56px 56px;
      .title {
        font-weight: bold;
        font-size: 14px;
      }
    }
    b {
      color: #e9434b;
      font-weight: bold;
    }
  }
</style>
