<template>
    <a-modal class="export-modal" :width="600" :visible="visibleRef" :closable="false" :onCancel="handleCancel"
        title="请选择导出图层" :footer="null">
        <div class="layer-group">
            <a-checkbox v-model:checked="state.checkAll" :indeterminate="state.indeterminate" @change="onCheckAllChange">
                全部
            </a-checkbox>
            <a-checkbox-group v-model:value="state.checkedLayerList" class="layer-opts">
                <a-row>
                    <a-col :span="24" v-for="(item, idx) in state.plainOptions" :key="idx">
                        <a-checkbox :value="item.value" @change="handleChangeLayer(idx, item.value)">{{ item.label
                        }}</a-checkbox>
                        <a-checkbox-group v-model:value="state.checkedAreaList[idx]" class="layer-area-opts">
                            <a-row>
                                <a-col :span="4" v-for="(area, adx) in item.areas" :key="adx">
                                    <a-checkbox :value="area.value" @change="handleChangeArea(idx)">
                                        <span class="area-opt-label">{{ area.label }}</span>
                                    </a-checkbox>
                                </a-col>
                            </a-row>
                        </a-checkbox-group>
                    </a-col>
                </a-row>
            </a-checkbox-group>
        </div>
        <div class="button-group">
            <a-space>
                <a-button size="small" @click="handleCancel">取消</a-button>
                <a-button type="primary" @click="handleOk">确定</a-button>
            </a-space>
        </div>
    </a-modal>
</template>
  
<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue';
const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    layers: {
        type: Array,
        default: []
    }
})
const emits = defineEmits(['emitCloseExport', 'emitFormatExpData'])

const visibleRef = ref(false);
const state: any = reactive({
    indeterminate: false,
    checkAll: true,
    checkedLayerList: [],
    checkedAreaList: [],
    plainOptions: []
});

const onCheckAllChange = (e: any) => {
    Object.assign(state, {
        checkedLayerList: e.target.checked ? state.plainOptions.map((item: any) => {
            return item.value
        }) : [],
        checkedAreaList: e.target.checked ? state.plainOptions.map((item: any) => {
            return item.areas.map((area: any) => {
                return area.value
            })
        }): [],
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
        return item.value
    })
    const areaOrders = state.plainOptions.map((item: any) => {
        return item.areas.map((area: any) => {
            return area.value
        })
    })
    const resultLayersIdx: Array<number> = [];
    for (let i = 0; i < layerOrders.length; i++) {
        const index = state.checkedLayerList.indexOf(layerOrders[i])
        if (index > -1) {
            resultLayersIdx.push(i)
        }
    }
    const resultAreasIdx: any = [];
    for (let i = 0; i < areaOrders.length; i++) {
        resultAreasIdx.push([])
        for (let j = 0; j < areaOrders[i].length; j++) {
            const index = state.checkedAreaList[i].indexOf(areaOrders[i][j])
            if (index > -1) {
                resultAreasIdx[i].push(j)
            }
        }
    }
    emits('emitFormatExpData', {
        layers: resultLayersIdx,
        areas: resultAreasIdx
    })
    handleCancel()
}

function handleChangeArea(idx: number) {
    nextTick(() => {
        const length = state.checkedAreaList[idx].length
        const layerValue = state.plainOptions[idx].value
        if (length && state.checkedLayerList.indexOf(layerValue) < 0) {
            state.checkedLayerList = [...state.checkedLayerList, layerValue]
        }
    })
}
function handleChangeLayer(idx: number, value: string) {
    nextTick(() => {
        const index = state.checkedLayerList.indexOf(value);
        if (index < 0) {
            state.checkedAreaList[idx] = []
        } else {
            state.checkedAreaList[idx] = state.plainOptions[idx].areas.map((area: any) => {
                return area.value
            })
        }
    })

}
watch(
    () => state.checkedLayerList,
    val => {
        state.indeterminate = !!val.length && val.length < state.plainOptions.length;
        state.checkAll = val.length === state.plainOptions.length;
    },
);
watch(
    () => props.visible,
    (newVal) => {
        visibleRef.value = newVal;
        state.plainOptions = props.layers.map((item: any) => {
            return {
                label: item.name,
                value: item.uuid,
                areas: item.areas.map((area: any) => {
                    return {
                        label: area.name,
                        value: area.uuid,
                    }
                })
            }
        })
        state.checkedLayerList = props.layers.map((item: any) => {
            return item.uuid
        })
        state.checkedAreaList = props.layers.map((item: any) => {
            return item.areas.map((area: any) => {
                return area.uuid
            })
        })
    },
    { immediate: true }
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
    }

    .layer-area-opts {
        width: 100%;
        margin: 5px 0;
        box-sizing: border-box;
        padding-left: 25px;
    }
}

.ant-modal-header {
    text-align: center;
}

.area-opt-label {
    display: inline-block;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 60px;
    line-height: 10px;
}

.button-group {
    text-align: right;
    box-sizing: border-box;
    padding: 10px 16px;

    .ant-btn {
        width: 70px;
        height: 35px;
        font-size: 12px;
    }
}
</style>
  