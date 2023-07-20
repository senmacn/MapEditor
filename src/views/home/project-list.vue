<template>
  <a-list
    class="project-list"
    size="small"
    :bordered="false"
    :data-source="visibleDataSourceRef"
    :pagination="paginationProps"
  >
    <template #header>
      <div class="history-search">
        <a-input v-model:value="searchValueRef" placeholder="搜索项目">
          <template #prefix>
            <search-outlined></search-outlined>
          </template>
        </a-input>
      </div>
    </template>
    <template #renderItem="{ item }">
      <project-item :item="item" @refresh-list="(msg) => emits('refresh-list', msg)"></project-item>
    </template>
  </a-list>
</template>

<script setup lang="ts">
  import type { LocalMapHistory } from './common/types';
  import { computed, ref } from 'vue';
  import ProjectItem from './children/project-item.vue';
  import { SearchOutlined } from '@ant-design/icons-vue';

  const emits = defineEmits<{
    (e: 'refresh-list', showMessage: boolean): void;
  }>();

  const props = defineProps({
    dataSource: {
      type: Array as PropType<LocalMapHistory[]>,
      default: () => [],
    },
  });

  const paginationProps = computed(() => ({
    pageSize: 6,
    total: visibleDataSourceRef.value.length,
  }));
  const searchValueRef = ref('');
  const visibleDataSourceRef = computed(() => {
    if (!searchValueRef.value) {
      return props.dataSource;
    }
    return props.dataSource.filter((item) => item.title.includes(searchValueRef.value));
  });
</script>

<style lang="less">
  .project-list {
    .ant-list-header {
      border-bottom: 0 !important;
    }
    .history-search {
      padding-left: 12px;
      .ant-input-affix-wrapper {
        width: 100%;
        border: 1px solid @color-border-3;
      }
      .anticon-search {
        color: aquamarine;
      }
    }
  }
</style>
