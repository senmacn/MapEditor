<template>
  <a-modal
    :title="null"
    class="upload-background-modal"
    :width="660"
    :visible="visible"
    :mask-closable="false"
    :closable="false"
    :onCancel="handleCancel"
    :footer="null"
  >
    <div class="modal-title">图层背景图上传</div>
    <div class="modal-content">
      <a-space direction="vertical" size="large">
        <a-space>
          启用压缩
          <a-switch v-model:checked="compressRef" />
          <info-circle-outlined class="warning-color" />
          <span class="tip"> 默认开启可优化编辑器速度，底图模糊时可关闭此选项并重新上传！ </span>
        </a-space>
      </a-space>

      <transition name="fade" mode="out-in">
        <div v-if="stepRef === Step.START">
          <a-divider plain>上传类型</a-divider>
          <button class="step-button" @click="handleGotoFull">全图上传</button>
          <button class="step-button" @click="handleGotoSlice">分片上传</button>
        </div>
        <div v-else-if="stepRef === Step.Full" class="full-upload">
          <a-divider plain>全图上传</a-divider>
          <a-upload
            :beforeUpload="handleUploadFull"
            accept=".png,.jpg"
            list-type="picture-card"
            :showUploadList="false"
          >
            <picture-outlined class="success-color" v-if="fileStringRef"></picture-outlined>
            <plus-outlined v-else></plus-outlined>
          </a-upload>
        </div>
        <div v-else-if="stepRef === Step.SLICE" class="slice-upload">
          <a-divider plain>分片上传</a-divider>
          <a-space>
            分片数量
            <a-input-number
              :value="slicesRef"
              :controls="false"
              :min="1"
              @change="handleSlicesChange"
            />
            <info-circle-outlined class="warning-color" />
            <span class="tip"> 分片数量为需要上传的图片数量，请按先横向后纵向的顺序上传！ </span>
          </a-space>
          <div class="slice-upload-content">
            <a-upload
              v-model:file-list="sliceFileList"
              :beforeUpload="handleUploadSlice"
              :previewIcon="null"
              :maxCount="slicesRef"
              accept=".png,.jpg"
              list-type="picture-card"
              :showUploadList="true"
            >
              <picture-outlined class="success-color" v-if="fileStringRef"></picture-outlined>
              <plus-outlined v-else></plus-outlined>
            </a-upload>
          </div>
        </div>
      </transition>
    </div>
    <div class="button-group">
      <a-button
        type="primary"
        v-if="stepRef === Step.Full"
        @click="handleOk"
        :disabled="!fileStringRef"
      >
        确定
      </a-button>
      <a-button
        type="primary"
        v-if="stepRef === Step.SLICE"
        @click="handleSlicesUpload"
        :disabled="sliceFileList.length !== slicesRef"
      >
        确定
      </a-button>
      <a-button v-if="stepRef !== Step.START" @click="stepRef = Step.START">返回</a-button>
      <a-button @click="handleCancel">取消</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
  import { useLoading } from '@/components/Loading';
  import { useEditorConfig } from '@/store/modules/editor-config';
  import { compressionFile, dataURLToImage, fileToDataURL } from '@/utils/file/image';
  import { InfoCircleOutlined, PlusOutlined, PictureOutlined } from '@ant-design/icons-vue';
  import { message } from 'ant-design-vue';
  import { UploadFile } from 'ant-design-vue/es/upload/interface';
  import { ref } from 'vue';

  enum Step {
    START,
    Full,
    SLICE,
  }

  const emit = defineEmits<{
    (event: 'ok', base64: string): void;
    (event: 'cancel'): void;
  }>();

  defineProps({
    visible: {
      type: Boolean,
      default: false,
    },
  });

  const configRef = useEditorConfig();
  const compressRef = ref(true);
  const fileStringRef = ref('');
  const [openLoading, closeLoading] = useLoading({ minTime: 150 });

  // 上传方式
  const stepRef = ref(Step.START);
  function handleGotoFull() {
    fileStringRef.value = '';
    stepRef.value = Step.Full;
  }
  function handleGotoSlice() {
    fileStringRef.value = '';
    stepRef.value = Step.SLICE;
  }

  // 全图上传
  async function handleUploadFull(file: File) {
    openLoading();
    if (compressRef.value) {
      const compressedFile = await compressionFile(file);
      fileStringRef.value = await fileToDataURL(compressedFile);
    } else {
      fileStringRef.value = await fileToDataURL(file);
    }
    const image = await dataURLToImage(fileStringRef.value);
    if (image.width !== configRef.getSize.x || image.height !== configRef.getSize.y) {
      message.warning('图片尺寸未对应当前尺寸设置，请确认设置或检查文件是否上传正确！', 10);
    }
    closeLoading();
    return Promise.reject();
  }
  // 分片上传
  const slicesRef = ref(1);
  function handleSlicesChange(value) {
    slicesRef.value = value;
  }
  const sliceFileList = ref<UploadFile[]>([]);
  function handleUploadSlice() {
    return Promise.reject();
  }
  async function handleSlicesUpload() {
    const canvas = document.createElement('canvas');
    canvas.width = configRef.getSize.x;
    canvas.height = configRef.getSize.y;
    const context = canvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    const fileStrList = sliceFileList.value.map((uploadFile) => uploadFile.originFileObj) as File[];
    let usedX = 0;
    let usedY = 0;
    for (let index = 0; index < fileStrList.length; index++) {
      const element = fileStrList[index];
      const dataUrl = await fileToDataURL(element);
      const image = await dataURLToImage(dataUrl);
      context.drawImage(image, usedX, usedY);
      usedX += image.width;
      if (usedX >= configRef.getSize.x) {
        usedX = 0;
        usedY += image.height;
      }
    }
    fileStringRef.value = canvas.toDataURL('image/jpeg', compressRef.value ? 1 : 0.2);
    handleOk();
  }

  function handleOk() {
    emit('ok', fileStringRef.value);
  }

  function handleCancel() {
    emit('cancel');
  }
</script>

<style lang="less">
  .upload-background-modal {
    .modal-content {
      padding-top: 20px;
      height: 500px;
    }
    .tip {
      font-size: 10px;
      color: @color-text-4;
    }
    .full-upload {
      .ant-upload-picture-card-wrapper {
        text-align: center;
      }
      .ant-upload {
        width: 200px;
        height: 200px;
      }
      .anticon {
        font-size: 20px;
      }
    }
    .slice-upload {
      .slice-upload-content {
        margin-top: 10px;
        padding: 10px;
        height: 320px;
        border: 1px dashed @color-border-3;
      }
      a[title='预览文件'] {
        display: none;
      }
    }
    .step-button {
      margin: 0 48px;
      width: 200px;
      height: 200px;
      font-size: 14px;
      border-radius: 8px;
      color: @text-color;
      background-color: @color-fill-2;
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
    .fade-enter-active,
    .fade-leave-active {
      transition: opacity 0.3s ease;
    }

    .fade-enter-from,
    .fade-leave-to {
      opacity: 0;
    }
  }
</style>
