<template>
  <div class="custom-page">
    <div class="custom-wrapper">
      <div class="custom-title"> 通用设置 </div>
      <div class="custom-content">
        <a-checkbox>打开项目在新窗口显示</a-checkbox>
      </div>
    </div>
    <div class="custom-wrapper">
      <div class="custom-title"> 颜色方案 </div>
      <div class="custom-content"> </div>
    </div>
    <div class="custom-wrapper">
      <div class="custom-title"> 按键映射启用 </div>
      <div class="custom-content">
        <a-checkbox>CTRL + S 快速保存项目</a-checkbox>
      </div>
    </div>
    <div class="custom-wrapper">
      <div class="custom-title"> 启动设置 </div>
      <div class="custom-content"> </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="less">
  .custom-page {
    padding: 30px;
    user-select: none;
    .custom-wrapper {
      margin-bottom: 30px;
    }
    .custom-title {
      font-size: 16px;
    }
    .custom-content {
      display: flex;
      flex-direction: column;
      padding: 10px;
    }
  }
</style>
