<template>
  <div class="home-container">
    <div class="home-left">
      <div class="home-info">
        <img class="ant-nav-logo" width="100" height="100" src="../../assets/icons/map.svg" />
        <div class="title"> 地图编辑器 </div>
        <div> 版本: v0.0.1 </div>
      </div>
      <div class="home-bars">
        <div
          :class="['bar-item', activePanelRef === HomePanel.HistoryList && 'active']"
          @click="activePanelRef = HomePanel.HistoryList"
        >
          项目列表
        </div>
        <div
          :class="['bar-item', activePanelRef === HomePanel.Custom && 'active']"
          @click="activePanelRef = HomePanel.Custom"
        >
          自定义
        </div>
        <div class="bar-item" @click="openDocument"> 使用文档 </div>
        <div class="bar-item" @click="openLog"> 更新日志 </div>
      </div>
    </div>
    <div class="home-right">
      <keep-alive>
        <component
          :is="
            activePanelRef === HomePanel.HistoryList
              ? HistoryList
              : activePanelRef === HomePanel.Custom
              ? CustomPage
              : {}
          "
        ></component>
      </keep-alive>
    </div>
    <tips-modal />
  </div>
</template>

<script setup lang="ts">
  import { getLocalApi } from '@/utils/env';
  import HistoryList from './children/history-list.vue';
  import CustomPage from './children/custom-page.vue';
  import TipsModal from './children/tips-modal.vue';
  import { ref } from 'vue';

  enum HomePanel {
    HistoryList,
    Custom,
  }

  const activePanelRef = ref(HomePanel.HistoryList);

  const localApi = getLocalApi();
  if (!localApi) {
    const url = location.href.slice().replace(/#\/.+/, '#/map-editor?name=');
    location.replace(url);
  }

  function openDocument() {
    getLocalApi()?.newWindow('https://docs.oa.wanmei.net/kdocs/l/cgpQRPmL23TQ', true);
  }
  function openLog() {
    getLocalApi()?.newWindow('https://docs.oa.wanmei.net/weboffice/l/cvFBr84fiEZz?timestamp=1690340901454', true);
  }
</script>

<style lang="less">
  .home-container {
    padding-top: 32px;
    display: flex;
    height: 100vh;
    width: 100vw;
    margin: 0 auto;
  }
  .home-left {
    padding: 20px;
    width: 250px;
  }
  .home-info {
    font-size: 12px;
    line-height: 20px;
    color: @color-text-1;
    text-align: center;
    .title {
      font-size: 18px;
      font-weight: bold;
    }
  }
  .home-bars {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    margin-top: 30px;
  }
  .bar-item {
    width: 100%;
    height: 42px;
    padding: 5px 0;
    line-height: 32px;
    text-align: center;
    color: @color-text-3;
    cursor: pointer;
    &.active {
      color: @color-text-1;
      border-radius: 6px;
      background: rgba(10, 10, 10, 0.1);
    }
  }
</style>
