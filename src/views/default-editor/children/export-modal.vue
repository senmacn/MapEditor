<template>
  <a-modal
    class="export-modal"
    :width="600"
    :visible="visibleRef"
    :closable="false"
    :onCancel="handleCancel"
    :title="null"
    :footer="null"
  >
    <div class="modal-title">请选择导出图层</div>
    <div class="modal-content">
      <div class="layer-group">
        <a-checkbox v-model:checked="state.checkAll" :indeterminate="state.indeterminate" @change="onCheckAllChange">
          全部
        </a-checkbox>
        <a-checkbox-group v-model:value="state.checkedLayerList" class="layer-opts">
          <a-row>
            <a-col :span="24" v-for="(item, idx) in state.plainOptions" :key="idx">
              <a-checkbox :value="item.value" @change="handleChangeLayer(idx, item.value)">
                {{ item.label }}
              </a-checkbox>
              <a-checkbox-group v-model:value="state.checkedAreaList[idx]" class="layer-area-opts">
                <a-row>
                  <a-col :span="6" v-for="(area, adx) in item.areas" :key="adx">
                    <a-checkbox :value="area.value" @change="handleChangeArea(idx)">
                      <gateway-outlined />
                      <span class="area-opt-label">{{ area.label }}</span>
                    </a-checkbox>
                  </a-col>
                </a-row>
              </a-checkbox-group>
              <a-checkbox-group v-model:value="state.checkedPinList[idx]" class="layer-area-opts">
                <a-row>
                  <a-col :span="6" v-for="(pin, adx) in item.pins" :key="adx">
                    <a-checkbox :value="pin.value" @change="handleChangeArea(idx)">
                      <pushpin-outlined />
                      <span class="area-opt-label">{{ pin.label }}</span>
                    </a-checkbox>
                  </a-col>
                </a-row>
              </a-checkbox-group>
              <a-checkbox-group v-model:value="state.checkedPathwayList[idx]" class="layer-area-opts">
                <a-row>
                  <a-col :span="6" v-for="(pathway, adx) in item.pathways" :key="adx">
                    <a-checkbox :value="pathway.value" @change="handleChangeArea(idx)">
                      <pushpin-outlined />
                      <span class="area-opt-label">{{ pathway.label }}</span>
                    </a-checkbox>
                  </a-col>
                </a-row>
              </a-checkbox-group>
            </a-col>
          </a-row>
        </a-checkbox-group>
      </div>
    </div>
    <div class="ant-modal-footer">
      <a-button size="small" @click="handleCancel">取消</a-button>
      <a-button type="primary" @click="handleOk">确定</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import type { Area, Pathway, Pin } from '../draw-element';
  import type { Layer } from '../common/types';
  import { ref, reactive, watch, nextTick } from 'vue';
  import { PushpinOutlined, GatewayOutlined } from '@ant-design/icons-vue';

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false,
    },
    layers: {
      type: Array as PropType<Layer[]>,
      default: [],
    },
  });
  const emits = defineEmits(['emitCloseExport', 'emitFormatExpData']);

  const visibleRef = ref(false);
  const state = reactive<{
    indeterminate: boolean;
    checkAll: boolean;
    checkedLayerList: any[];
    checkedAreaList: any[];
    checkedPinList: any[];
    checkedPathwayList: any[];
    plainOptions: any[];
  }>({
    indeterminate: false,
    checkAll: true,
    checkedLayerList: [],
    checkedAreaList: [],
    checkedPinList: [],
    checkedPathwayList: [],
    plainOptions: [],
  });

  const onCheckAllChange = (e) => {
    Object.assign(state, {
      checkedLayerList: e.target.checked
        ? state.plainOptions.map((item) => {
            return item.value;
          })
        : [],
      checkedAreaList: e.target.checked
        ? state.plainOptions.map((item) => {
            return item.areas.map((area) => {
              return area.value;
            });
          })
        : [],
      checkedPinList: e.target.checked
        ? state.plainOptions.map((item) => {
            return item.pins.map((pin) => {
              return pin.value;
            });
          })
        : [],
      checkedPathwayList: e.target.checked
        ? state.plainOptions.map((item) => {
            return item.pathways.map((pathway) => {
              return pathway.value;
            });
          })
        : [],
      indeterminate: false,
    });
  };
  function handleCancel() {
    visibleRef.value = false;
    state.checkAll = true;
    emits('emitCloseExport');
  }
  function handleOk() {
    const layerOrders = state.plainOptions.map((item: any) => {
      return item.value;
    });
    const areaOrders = state.plainOptions.map((item: any) => {
      return item.areas.map((area: any) => {
        return area.value;
      });
    });
    const pinOrders = state.plainOptions.map((item: any) => {
      return item.pins.map((pin: any) => {
        return pin.value;
      });
    });
    const pathwayOrders = state.plainOptions.map((item: any) => {
      return item.pathways.map((pathway: any) => {
        return pathway.value;
      });
    });
    const resultLayersIdx: Array<number> = [];
    for (let i = 0; i < layerOrders.length; i++) {
      const index = state.checkedLayerList.indexOf(layerOrders[i]);
      if (index > -1) {
        resultLayersIdx.push(i);
      }
    }
    const resultAreasIdx: number[][] = [];
    for (let i = 0; i < areaOrders.length; i++) {
      resultAreasIdx.push([]);
      for (let j = 0; j < areaOrders[i].length; j++) {
        const index = state.checkedAreaList[i].indexOf(areaOrders[i][j]);
        if (index > -1) {
          resultAreasIdx[i].push(j);
        }
      }
    }
    const resultPinsIdx: number[][] = [];
    for (let i = 0; i < pinOrders.length; i++) {
      resultPinsIdx.push([]);
      for (let j = 0; j < pinOrders[i].length; j++) {
        const index = state.checkedPinList[i].indexOf(pinOrders[i][j]);
        if (index > -1) {
          resultPinsIdx[i].push(j);
        }
      }
    }
    const resultPathwaysIdx: number[][] = [];
    for (let i = 0; i < pathwayOrders.length; i++) {
      resultPathwaysIdx.push([]);
      for (let j = 0; j < pathwayOrders[i].length; j++) {
        const index = state.checkedPathwayList[i].indexOf(pathwayOrders[i][j]);
        if (index > -1) {
          resultPathwaysIdx[i].push(j);
        }
      }
    }
    emits('emitFormatExpData', {
      layers: resultLayersIdx,
      areas: resultAreasIdx,
      pins: resultPinsIdx,
      pathways: resultPathwaysIdx,
    });
    handleCancel();
  }

  function handleChangeArea(idx: number) {
    nextTick(() => {
      const length = state.checkedAreaList[idx].length;
      const layerValue = state.plainOptions[idx].value;
      if (length && state.checkedLayerList.indexOf(layerValue) < 0) {
        state.checkedLayerList = [...state.checkedLayerList, layerValue];
      }
    });
  }
  function handleChangeLayer(idx: number, value: string) {
    nextTick(() => {
      const index = state.checkedLayerList.indexOf(value);
      if (index < 0) {
        state.checkedAreaList[idx] = [];
        state.checkedPinList[idx] = [];
        state.checkedPathwayList[idx] = [];
      } else {
        state.checkedAreaList[idx] = state.plainOptions[idx].areas.map((area) => {
          return area.value;
        });
        state.checkedPinList[idx] = state.plainOptions[idx].pins.map((pin) => {
          return pin.value;
        });
        state.checkedPathwayList[idx] = state.plainOptions[idx].pins.map((pathway) => {
          return pathway.value;
        });
      }
    });
  }
  watch(
    () => state.checkedLayerList,
    (val) => {
      state.indeterminate = !!val.length && val.length < state.plainOptions.length;
      state.checkAll = val.length === state.plainOptions.length;
    },
  );
  watch(
    () => props.visible,
    (newVal) => {
      visibleRef.value = newVal;
      state.plainOptions = props.layers.map((item) => {
        return {
          label: item.name,
          value: item.uuid,
          areas: item.areas.map((area: Area) => {
            return {
              label: area.getName(),
              value: area.getUuid(),
            };
          }),
          pins: item.pins.map((pin: Pin) => {
            return {
              label: pin.getName(),
              value: pin.getUuid(),
            };
          }),
          pathways: item.pathways.map((pathway: Pathway) => {
            return {
              label: pathway.getName(),
              value: pathway.getUuid(),
            };
          }),
        };
      });
      state.checkedLayerList = props.layers.map((item) => {
        return item.uuid;
      });
      state.checkedAreaList = props.layers.map((item) => {
        return item.areas.map((area) => {
          return area.getUuid();
        });
      });
      state.checkedPinList = props.layers.map((item) => {
        return item.pins.map((pin) => {
          return pin.getUuid();
        });
      });
      state.checkedPathwayList = props.layers.map((item) => {
        return item.pathways.map((pathway) => {
          return pathway.getUuid();
        });
      });
    },
    { immediate: true },
  );
</script>

<style lang="less">
  .layer-group {
    width: 100%;
    box-sizing: border-box;
    padding: 16px;

    .layer-opts {
      width: 100%;
      margin-top: 10px;
      max-height: 500px;
      overflow-y: auto;
    }

    .layer-area-opts {
      width: 100%;
      margin: 5px 0;
      box-sizing: border-box;
      padding-left: 25px;
    }
  }

  .area-opt-label {
    display: inline-block;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 60px;
    line-height: 12px;
  }
</style>
