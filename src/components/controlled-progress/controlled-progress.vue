<template>
  <div class="controlled-progress">
    <a-progress
      size="small"
      :stroke-color="{
        from: 'rgb(144 196 239)',
        to: 'rgb(144 231 146)',
      }"
      trailColor="rgba(255,255,255,0.4)"
      :percent="percentRef"
      :status="percentRef === 100 ? 'success' : 'active'"
    />
    <!-- <a-popover :visible="visibleRef" trigger="click">
      <a-badge :dot="true">
        <bell-outlined />
      </a-badge>
      <template #content>
        <div> </div>
      </template>
    </a-popover> -->
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import { onProgressEvent } from './progress-event';
  import { ProgressEventPayload, ProgressMessage } from './type';
  // import { BellOutlined } from '@ant-design/icons-vue';

  // const visibleRef = ref(false);

  const percentCountRef = ref(0);
  const maxPercentCountRef = ref(1);
  const messages = reactive<ProgressMessage[]>([]);
  onProgressEvent((_, payload: ProgressEventPayload) => {
    if (payload.type === 'start') {
      maxPercentCountRef.value = payload.count || 10;
      percentCountRef.value = 0;
    } else {
      percentCountRef.value = percentCountRef.value + 1;
    }
    if (payload.message) {
      messages.push(payload.message);
    }
  });

  const percentRef = computed(() =>
    Math.round((percentCountRef.value / maxPercentCountRef.value) * 100),
  );
</script>

<style lang="less">
  .controlled-progress {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    .anticon {
      font-size: 13px;
    }
  }
</style>
