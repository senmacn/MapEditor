<template>
  <div
    class="cet-titlebar cet-windows inactive"
    style="height: 32px; color: rgb(238, 238, 238)"
  >
    <div class="cet-drag-region"> </div>
    <div class="cet-resizer left"> </div>
    <div class="cet-resizer top"> </div>
    <div class="cet-icon">
      <img src="/map.svg" style="height: 16px" />
    </div>
    <div class="cet-menubar" role="menubar"> </div>
    <div class="cet-title cet-title-left" style="cursor: default">地图编辑器</div>
    <div class="cet-window-controls">
      <div class="cet-control-minimize cet-control-icon" @click="handleMinimize">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11 11">
          <path d="M11,4.9v1.1H0V4.399h11z"></path>
        </svg>
      </div>
      <div class="cet-control-maximize cet-control-icon" @click="handleMaximize">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11 11">
          <path
            d="M0,1.7v7.6C0,10.2,0.8,11,1.7,11h7.6c0.9,0,1.7-0.8,1.7-1.7V1.7C11,0.8,10.2,0,9.3,0H1.7C0.8,0,0,0.8,0,1.7z M8.8,9.9H2.2c-0.6,0-1.1-0.5-1.1-1.1V2.2c0-0.6,0.5-1.1,1.1-1.1h6.7c0.6,0,1.1,0.5,1.1,1.1v6.7C9.9,9.4,9.4,9.9,8.8,9.9z"
          ></path>
        </svg>
      </div>
      <div class="cet-control-close cet-control-icon" @click="handleWindowClose">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11 11">
          <path
            d="M6.279 5.5L11 10.221l-.779.779L5.5 6.279.779 11 0 10.221 4.721 5.5 0 .779.779 0 5.5 4.721 10.221 0 11 .779 6.279 5.5z"
          ></path>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { getLocalApi } from '../../utils/env';
  import { Modal } from 'ant-design-vue';

  const localApi = getLocalApi();

  function handleMinimize() {
    localApi?.minimizeWindow();
  }

  function handleMaximize() {
    localApi?.maximizeWindow();
  }

  function handleWindowClose() {
    if (location.href.includes('/map-editor')) {
      Modal.confirm({
        title: '关闭',
        content: '关闭编辑器前请确认更改已保存。如果不保存，你的更改将丢失。',
        type: 'warning',
        okText: '确定',
        cancelText: '取消',
        onOk: () => {
          localApi?.closeWindow();
        },
      });
    } else {
      localApi?.closeWindow();
    }
  }
</script>

<style>
  .cet-titlebar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    flex-wrap: wrap;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    font-size: 13px;
    font-family: Arial, Helvetica, sans-serif;
    box-sizing: border-box;
    padding: 0 16px;
    overflow: hidden;
    height: 32px;
    color: rgb(238, 238, 238);
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
    zoom: 1;
    width: 100%;
    height: 31px;
    line-height: 31px;
    z-index: 99999;
  }

  .cet-titlebar *,
  .cet-titlebar *:before,
  .cet-titlebar *:after {
    box-sizing: border-box;
  }

  .cet-titlebar.cet-windows,
  .cet-titlebar.cet-linux {
    padding: 0;
    height: 30px;
    line-height: 30px;
    justify-content: left;
    overflow: visible;
  }

  /* Inverted */
  .cet-titlebar.cet-inverted {
    flex-direction: row-reverse;
  }

  .cet-titlebar.cet-inverted .cet-menubar,
  .cet-titlebar.cet-inverted .cet-window-controls {
    flex-direction: row-reverse;
    margin-left: 20px;
    margin-right: 0;
  }

  /* First buttons */
  .cet-titlebar.cet-first-buttons .cet-window-controls {
    order: -1;
    margin: 0 5px 0 0;
  }

  .cet-titlebar.cet-inverted .cet-window-controls {
    margin: 0 5px 0 0;
  }

  /* Shadow */
  .cet-titlebar.cet-shadow {
    box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2), 0 1px 1px 0 rgba(0, 0, 0, 0.14),
      0 1px 3px 0 rgba(0, 0, 0, 0.12);
  }

  /* Drag region */
  .cet-drag-region {
    top: 0;
    left: 0;
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: -1;
    -webkit-app-region: drag;
  }

  /* Icon */
  .cet-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 30px;
    z-index: 99;
    overflow: hidden;
  }

  /* Title */
  .cet-title {
    flex: 0 1 auto;
    font-size: 12px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    zoom: 1;
  }

  /* Title alignment */
  .cet-title.cet-title-left {
    margin-left: 8px;
    margin-right: auto;
  }

  .cet-title.cet-title-right {
    margin-left: auto;
    margin-right: 8px;
  }

  .cet-title.cet-title-center {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .cet-title.cet-bigsur {
    font-size: 13px;
    font-weight: 600;
  }

  /* Window controls */
  .cet-window-controls {
    display: flex;
    flex-grow: 0;
    flex-shrink: 0;
    text-align: center;
    position: relative;
    z-index: 99;
    -webkit-app-region: no-drag;
    height: 30px;
    font-family: initial !important;
    margin-left: auto;
  }

  .cet-control-icon {
    width: 46px;
  }

  .cet-control-icon:not(.inactive):hover {
    background-color: rgb(255 255 255 / 12%);
  }

  .light .cet-control-icon:not(.inactive):hover {
    background-color: rgb(0 0 0 / 12%);
  }

  .cet-control-icon.inactive svg {
    opacity: 0.4;
  }

  .cet-control-icon svg {
    width: 10px;
    height: -webkit-fill-available;
    fill: #fff;
    display: initial !important;
    vertical-align: unset !important;
  }

  .cet-titlebar.light .cet-control-icon svg {
    fill: #222222 !important;
  }

  .cet-control-close:not(.inactive):hover {
    background-color: rgb(232 17 35 / 90%) !important;
  }

  .cet-control-close:not(.inactive):hover svg {
    fill: #fff !important;
  }

  .cet-resizer {
    -webkit-app-region: no-drag;
    position: absolute;
  }

  .cet-resizer.left {
    top: 0;
    left: 0;
    width: 6px;
    height: 100%;
  }

  .cet-resizer.top {
    top: 0;
    width: 100%;
    height: 6px;
  }

  .cet-container {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: auto;
    z-index: 1;
  }
</style>
