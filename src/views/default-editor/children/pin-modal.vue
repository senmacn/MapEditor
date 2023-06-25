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
          <a-input size="small" v-model:value="formModel.name" />
        </a-form-item>
        <a-form-item name="author" label="作者">
          <a-input size="small" v-model:value="formModel.author" />
        </a-form-item>
        <a-form-item name="type" label="类型">
          <a-input size="small" v-model:value="formModel.type" />
        </a-form-item>
        <a-form-item name="state" label="状态">
          <a-input size="small" v-model:value="formModel.state" />
        </a-form-item>
        <a-form-item name="jira" label="JIRA">
          <a-input size="small" v-model:value="formModel.jira" />
        </a-form-item>
        <a-form-item name="icon" label="图标">
          <a-radio-group
            class="icon-radios"
            type="button"
            v-model:value="formModel.icon"
            size="small"
          >
            <a-space>
              <a-radio-button :value="PinIcon.star">
                <img src="@/assets/images/star.png" alt="star" />
              </a-radio-button>
              <a-radio-button :value="PinIcon.more">
                <img src="@/assets/images/more.png" alt="more" />
              </a-radio-button>
              <a-radio-button :value="PinIcon.chest">
                <img src="@/assets/images/chest.png" alt="chest" />
              </a-radio-button>
              <a-radio-button :value="PinIcon.backpack">
                <img src="@/assets/images/backpack.png" alt="backpack" />
              </a-radio-button>
              <a-radio-button :value="PinIcon.book">
                <img src="@/assets/images/book.png" alt="book" />
              </a-radio-button>
              <a-radio-button :value="PinIcon.animal">
                <img src="@/assets/images/animal.png" alt="animal" />
              </a-radio-button>
              <a-radio-button :value="PinIcon.monster">
                <img src="@/assets/images/monster.png" alt="monster" />
              </a-radio-button>
              <a-radio-button :value="PinIcon.special">
                <img src="@/assets/images/special.png" alt="special" />
              </a-radio-button>
              <a-radio-button :value="PinIcon.world">
                <img src="@/assets/images/world.png" alt="world" />
              </a-radio-button>
            </a-space>
          </a-radio-group>
        </a-form-item>
        <a-form-item name="size" label="尺寸">
          <a-radio-group v-model:value="formModel.size" size="small" type="button">
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
          />
        </a-form-item>
        <a-form-item name="position" label="坐标">
          <span>{{ clickPositionRef?.offsetX }}, {{ clickPositionRef?.offsetY }}</span>
        </a-form-item>
      </a-form>
    </div>
    <div class="button-group">
      <a-button type="primary" @click="handleOk">确定</a-button>
      <a-button type="primary" @click="" disabled>分享</a-button>
      <a-button @click="handleCancel">关闭</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import { inject, reactive, ref } from 'vue';
  import { isNull } from '@/utils/is';
  import cloneDeep from 'lodash-es/cloneDeep';
  import { Pin, PinIcon } from '../draw-element';
  import { useCanvasState } from '@/store/modules/canvas-state';

  const clickPositionRef = inject<Recordable>('clickPositionRef', { offsetX: 0, offsetY: 0 });
  const initFormModel = {
    name: '',
    author: '',
    description: '',
    type: '',
    state: '',
    jira: '',
    icon: PinIcon.star,
    size: '60',
    position: { x: 0, y: 0 },
  };
  const formModel = reactive(cloneDeep(initFormModel));

  const visibleRef = ref(false);
  let isCreate = false;
  let uuid = '';
  const canvasState = useCanvasState();
  const pinFormRef = ref();
  function handleOk() {
    pinFormRef.value.validate().then(() => {
      const size = Number(formModel.size);
      formModel.position = {
        x: clickPositionRef.offsetX - size / 2,
        y: clickPositionRef.offsetY - size / 2,
      };
      for (let index = canvasState.getLayers.length - 1; index >= 0; index--) {
        const element = canvasState.getLayers[index];
        if (element.hot) {
          if (isCreate) {
            const pin = new Pin(
              formModel.name,
              formModel.author,
              formModel.description,
              formModel.type,
              formModel.state,
              formModel.jira,
              formModel.position,
              size,
              formModel.icon,
            );
            pin.layer = element;
            // @ts-ignore
            element.pins.push(pin);
          } else {
            element.pins.forEach((sitPin) => {
              if (sitPin.getUuid() === uuid) {
                sitPin.setName(formModel.name);
                sitPin.setAuthor(formModel.author);
                sitPin.setDescription(formModel.description);
                sitPin.setType(formModel.type);
                sitPin.setState(formModel.state);
                sitPin.setIcon(formModel.icon);
                sitPin.setJira(formModel.jira);
                sitPin.setBoundRect([formModel.position.x, formModel.position.y, size, size]);
                // TODO: 重新渲染
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
      isCreate = true;
    } else {
      isCreate = false;
      Object.assign(formModel, pin);
      uuid = pin.getUuid();
    }
    visibleRef.value = true;
  }
  defineExpose({
    setPin: setPin,
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
  }
</style>
