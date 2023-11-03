<template>
  <a-modal class="change-layer-modal" :width="500" :visible="visible" :closable="false" :footer="null">
    <div class="modal-title">切换图层</div>
    <div class="modal-content">
      <a-row class="title">
        将区域 <span><gateway-outlined />{{ element?.getName() }}</span> 移动到
      </a-row>
      <a-row v-for="layer in canvasState.getLayers">
        <div>
          <a-button type="text" :disabled="layer.uuid === element?.layer?.uuid" @click="handleChangeLayer(layer)">
            <template #icon>
              <right-circle-outlined />
            </template>
          </a-button>
          <block-outlined />
          {{ layer.name }}
        </div>
      </a-row>
    </div>
    <div class="ant-modal-footer">
      <a-button @click="emit('close')">关闭</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import type { Pin } from '../draw-element';
  import type { Layer } from '../common/types';
  import type DrawElement from '../draw-element';
  import { Area } from '../draw-element';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import { GatewayOutlined, BlockOutlined, RightCircleOutlined } from '@ant-design/icons-vue';

  const emit = defineEmits<{
    (e: 'close'): void;
  }>();

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false,
    },
    element: {
      type: Object as PropType<DrawElement>,
    },
  });

  const canvasState = useCanvasState();

  function handleChangeLayer(newLayer: Layer) {
    if (!props.element) return;
    if (newLayer.uuid === props.element?.layer?.uuid) return;
    const oldLayer = props.element.layer;
    if (oldLayer) {
      if (props.element instanceof Area) {
        const index = oldLayer.areas.findIndex((area) => area.getUuid() === props.element?.getUuid());
        oldLayer.areas.splice(index, 1);
      } else {
        const index = oldLayer.pins.findIndex((area) => area.getUuid() === props.element?.getUuid());
        oldLayer.pins.splice(index, 1);
      }
    }
    if (props.element instanceof Area) {
      newLayer.areas.push(props.element as Area);
    } else {
      newLayer.pins.push(props.element as Pin);
    }
    props.element.layer = newLayer;
    props.element.draw = 'update';
    emit('close');
  }
</script>

<style lang="less">
  .change-layer-modal {
    .modal-content {
      padding: 36px 56px 56px;
      .title {
        font-weight: bold;
        font-size: 14px;
      }
    }
  }
</style>
