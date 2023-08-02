<template>
  <a-modal
    class="pin-modal"
    :width="360"
    :visible="visibleRef"
    :closable="false"
    :onCancel="handleCancel"
    :title="null"
    :footer="null"
  >
    <div class="pin-wrapper">
      <div class="title">地图钉配置</div>
      <a-form
        ref="pinFormRef"
        :model="formModel"
        :labelCol="{ span: 4 }"
        :wrapperCol="{ span: 20 }"
        labelAlign="right"
      >
        <a-form-item
          name="name"
          label="名称"
          :validate-trigger="['change', 'input']"
          :rules="[{ required: true, message: '请填写名称！' }]"
        >
          <a-input size="small" v-model:value="formModel.name" :readonly="!canEditRef" />
        </a-form-item>
        <a-form-item name="author" label="作者">
          <a-input size="small" v-model:value="formModel.author" :readonly="!canEditRef" />
        </a-form-item>
        <a-form-item name="type" label="类型">
          <a-select
            mode="tags"
            :value="formModel.type"
            placeholder="选择一个已有类型或创建一个新类型"
            :options="areaTypeOptionsRef"
            :disabled="!canEditRef"
            @change="(val) => handleTypeChange(val)"
          ></a-select>
        </a-form-item>
        <a-form-item name="state" label="状态">
          <a-input size="small" v-model:value="formModel.state" :readonly="!canEditRef" />
        </a-form-item>
        <a-form-item name="jira" label="JIRA">
          <a-input size="small" v-model:value="formModel.jira" :readonly="!canEditRef" />
        </a-form-item>
        <a-form-item name="icon" label="图标">
          <a-radio-group
            class="icon-radios"
            type="button"
            v-model:value="formModel.icon"
            size="small"
            :disabled="!canEditRef"
          >
            <a-space>
              <a-radio-button :value="PinIcon.star">
                <img src="/images/star.png" alt="star" />
              </a-radio-button>
              <a-radio-button :value="PinIcon.more">
                <img src="/images/more.png" alt="more" />
              </a-radio-button>
              <a-radio-button :value="PinIcon.chest">
                <img src="/images/chest.png" alt="chest" />
              </a-radio-button>
              <a-radio-button :value="PinIcon.backpack">
                <img src="/images/backpack.png" alt="backpack" />
              </a-radio-button>
              <a-radio-button :value="PinIcon.book">
                <img src="/images/book.png" alt="book" />
              </a-radio-button>
              <a-radio-button :value="PinIcon.animal">
                <img src="/images/animal.png" alt="animal" />
              </a-radio-button>
              <a-radio-button :value="PinIcon.monster">
                <img src="/images/monster.png" alt="monster" />
              </a-radio-button>
              <a-radio-button :value="PinIcon.special">
                <img src="/images/special.png" alt="special" />
              </a-radio-button>
              <a-radio-button :value="PinIcon.world">
                <img src="/images/world.png" alt="world" />
              </a-radio-button>
            </a-space>
          </a-radio-group>
        </a-form-item>
        <a-form-item name="size" label="尺寸">
          <a-radio-group
            size="small"
            type="button"
            v-model:value="formModel.size"
            :disabled="!canEditRef"
          >
            <a-radio-button value="40">40</a-radio-button>
            <a-radio-button value="60">60</a-radio-button>
            <a-radio-button value="80">80</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item name="description" label="描述">
          <a-textarea
            size="small"
            v-model:value="formModel.description"
            show-word-limit
            :max-length="100"
            :readonly="!canEditRef"
          />
        </a-form-item>
        <a-form-item name="association" label="关联">
          <div class="association-wrapper" v-auto-animate>
            <div class="association-row head">
              <div>名称</div>
              <div>关系</div>
              <div>操作</div>
            </div>
            <div
              class="association-row"
              v-for="(item, index) in formModel.association"
              :key="index"
            >
              <div>{{ item.name }}</div>
              <div>{{ item.type }}</div>
              <div v-if="canEditRef">
                <a type="text" @click="() => handleShowEditModal(item)"> 编辑 </a>
                <a type="text" @click="() => formModel.association.splice(index, 1)"> 删除 </a>
              </div>
            </div>
            <div class="association-row">
              <a-button class="add" :disabled="!canEditRef" @click="() => handleShowEditModal()">
                +
              </a-button>
            </div>
          </div>
        </a-form-item>
      </a-form>
    </div>
    <div class="button-group">
      <a-button type="primary" v-if="canEditRef" @click="handleOk">确定</a-button>
      <a-button type="primary" v-else @click="() => (canEditRef = true)">编辑</a-button>
      <a-button type="primary" @click="handleShareLink" v-if="!isCreateRef">分享</a-button>
      <a-button @click="handleCancel">关闭</a-button>
    </div>
  </a-modal>
  <pin-association-edit-modal ref="editModal" @edit="handleCompleteEdit" />
  <share-link-modal
    :visible="shareLinkModalVisibleRef"
    :uuid="uuidRef"
    @close="() => (shareLinkModalVisibleRef = false)"
  />
</template>

<script setup lang="ts">
  import type { PinAssociation } from '../draw-element/type';
  import { computed, inject, reactive, ref } from 'vue';
  import { isNull } from '@/utils/is';
  import cloneDeep from 'lodash-es/cloneDeep';
  import DrawElement, { Pin, PinIcon } from '../draw-element';
  import { useCanvasState } from '@/store/modules/canvas-state';
  import pinAssociationEditModal from './pin-association-edit-modal.vue';
  import ShareLinkModal from './share-link-modal.vue';
  import { onFocusAreaEvent } from '../common/event';

  const clickPositionRef = inject<Recordable>('clickPositionRef', { offsetX: 0, offsetY: 0 });

  const canEditRef = ref(false);

  const initFormModel = {
    name: '',
    author: '',
    description: '',
    type: [],
    state: '',
    jira: '',
    icon: PinIcon.star,
    size: '60',
    position: { x: 0, y: 0 },
    association: [] as PinAssociation[],
  };
  const formModel = reactive(cloneDeep(initFormModel));

  const areaTypeOptionsRef = computed(() => {
    const options: string[] = [];
    canvasState.getLayers.forEach((layer) => {
      layer.areas.forEach((area) => {
        if (area.type && !options.includes(area.type)) {
          options.push(area.type);
        }
      });
    });
    return options.map((val) => ({ value: val }));
  });
  function handleTypeChange(val) {
    formModel.type = val.slice(-1);
  }

  const visibleRef = ref(false);
  let isCreateRef = ref(false);
  let uuid = '';
  const canvasState = useCanvasState();

  const editModal = ref();
  function handleShowEditModal(item?: PinAssociation) {
    editModal.value.setData(item);
  }
  function handleCompleteEdit(item: PinAssociation) {
    let editFlag = false;
    formModel.association.forEach((a) => {
      if (a.uuid === item.uuid) {
        Object.assign(a, item);
        editFlag = true;
      }
    });
    if (!editFlag) {
      formModel.association.push(item);
    }
  }

  const pinFormRef = ref();
  function handleOk() {
    pinFormRef.value.validate().then(() => {
      const size = Number(formModel.size);
      for (let index = canvasState.getLayers.length - 1; index >= 0; index--) {
        const element = canvasState.getLayers[index];
        if (element.hot) {
          if (isCreateRef.value) {
            const pin = new Pin(
              formModel.name,
              formModel.author,
              formModel.description,
              formModel.type && formModel.type[0],
              formModel.state,
              formModel.jira,
              {
                x: clickPositionRef.offsetX - size / 2,
                y: clickPositionRef.offsetY - size / 2,
              },
              size,
              formModel.icon,
            );
            pin.layer = element;
            pin.association = formModel.association;
            // @ts-ignore
            element.pins.push(pin);
            // 更新map
            canvasState.getPinMap.set(pin.getUuid(), pin);
          } else {
            element.pins.forEach((sitPin) => {
              if (sitPin.getUuid() === uuid) {
                sitPin.setName(formModel.name);
                sitPin.setAuthor(formModel.author);
                sitPin.setDescription(formModel.description);
                sitPin.setType(formModel.type[0]);
                sitPin.setState(formModel.state);
                sitPin.setIcon(formModel.icon);
                sitPin.setJira(formModel.jira);
                sitPin.setBoundRect([
                  sitPin.getBoundRect()[0],
                  sitPin.getBoundRect()[1],
                  size,
                  size,
                ]);
                sitPin.association = formModel.association;
                // 重新渲染
                sitPin.draw = 'update';
              }
            });
          }
        }
      }
      visibleRef.value = false;
    });
  }
  function handleCancel() {
    visibleRef.value = false;
  }

  function setPin(pin: Pin) {
    if (isNull(pin)) {
      Object.assign(formModel, cloneDeep(initFormModel));
      isCreateRef.value = true;
      canEditRef.value = true;
    } else {
      isCreateRef.value = false;
      canEditRef.value = false;
      Object.assign(formModel, pin);
      uuid = pin.getUuid();
    }
    visibleRef.value = true;
  }
  defineExpose({
    setPin: setPin,
  });

  const shareLinkModalVisibleRef = ref(false);
  const uuidRef = ref('');
  function handleShareLink() {
    uuidRef.value = uuid;
    shareLinkModalVisibleRef.value = true;
  }

  onFocusAreaEvent((_, ele: DrawElement) => {    
    if (ele instanceof Pin) {
      setPin(ele);
    }
  });
</script>

<style lang="less">
  .pin-modal {
    .ant-modal-header {
      display: none;
    }
    .ant-modal-content {
      padding: 4px;
    }
    .pin-wrapper {
      overflow: auto;
      span,
      label {
        font-size: 12px;
      }
    }
    .title {
      line-height: 36px;
      font-size: 14px;
      font-weight: bold;
      text-align: center;
      color: @color-text-1;
      border-bottom: 1px solid @color-modal-border;
    }
    .ant-form {
      padding: 20px 20px 0;
    }
    .icon-radios.ant-radio-group .ant-radio-button-wrapper {
      padding: 0;
      height: 32px;
      img {
        width: 28px;
        height: 28px;
      }
    }
    .ant-space {
      flex-wrap: wrap;
    }
    .button-group {
      display: flex;
      justify-content: space-around;
      align-items: start;
      width: 80%;
      height: 50px;
      margin: 0 auto;
      .ant-btn {
        width: 70px;
        height: 35px;
        font-size: 12px;
      }
    }
    .ant-radio-button-content {
      padding: 4px;
    }
    .association-wrapper {
      height: 110px;
      border: 1px solid @color-border-3;
      overflow-y: auto;
    }
    .association-row {
      display: flex;
      flex-direction: row;
      align-items: center;
      height: 22px;
      div {
        flex: 1;
        text-align: center;
        font-size: 12px;
      }
      &.head .div {
        font-weight: bold;
      }
      .ant-btn.add {
        width: 100%;
        height: 100%;
        line-height: 4px;
      }
    }
  }
</style>
