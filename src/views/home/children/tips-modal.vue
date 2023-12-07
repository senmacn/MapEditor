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
        <li>修复了路径定位以及编辑的部分问题。</li>
        <li>
          优化了大型区域完成时填充显示的逻辑。建议
          <span class="hot">选择区域内部点</span>
          时尽量选择
          <span class="hot">区域中心点</span>
          ，可以获得更快的(200%↑)填充速度。
        </li>
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
    .hot {
      color: #e9434b;
      font-weight: bold;
    }
  }
</style>
