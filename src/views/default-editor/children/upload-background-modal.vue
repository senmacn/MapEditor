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
        <a-space>
          图层透明
          <a-input-number
            v-model:value="transparencyRef"
            :max="1"
            :min="0"
            :step="0.1"
            size="small"
            mode="button"
            class="trans-input"
          />
          <info-circle-outlined class="warning-color" />
          <span class="tip"> 默认为不透明，数值越低透明度越大 </span>
        </a-space>
      </a-space>
      <transition name="fade" mode="out-in">
        <div v-if="stepRef === Step.START">
          <a-divider plain>上传类型</a-divider>
          <button class="step-button" @click="handleGotoFull">全图上传</button>
          <button class="step-button" @click="handleGotoSlice">分片上传</button>
          <button v-if="isLocal()" class="step-button" @click="handleGotoEXR">EXR上传</button>
        </div>
        <div v-else-if="stepRef === Step.Full" class="full-upload">
          <a-divider plain>全图上传</a-divider>
          <a-upload
            :beforeUpload="handleUploadFull"
            accept=".png,.jpg"
            list-type="picture-card"
            :showUploadList="false"
          >
            <plus-outlined></plus-outlined>
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
        <div v-else-if="stepRef === Step.EXR" class="exr-upload">
          <a-divider plain>EXR 上传</a-divider>
          <a-space direction="vertical">
            <div> 文件目录 </div>
            <div>
              <info-circle-outlined class="warning-color" />
              <span class="tip"> 请填写需要上传的 EXR 文件目录的路径，然后点击上传按钮 </span>
            </div>
            <a-input v-model:value="exrDirectoryRef"></a-input>
            <div class="option">
              <a-button type="primary" @click="handleExecuteEXR" :disabled="!exrDirectoryRef">
                上传
              </a-button>
            </div>
          </a-space>
        </div>
      </transition>
    </div>
    <div class="button-group">
      <a-button type="primary" v-if="stepRef === Step.START" @click="handleOk">
        透明度修改
      </a-button>
      <a-button
        type="primary"
        v-if="stepRef === Step.Full || stepRef === Step.EXR"
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
  import { getLocalApi, isLocal } from '@/utils/env';
  import { compressionFile, dataURLToImage, fileToDataURL } from '@/utils/file/image';
  import { InfoCircleOutlined, PlusOutlined, PictureOutlined } from '@ant-design/icons-vue';
  import { message } from 'ant-design-vue';
  import { UploadFile } from 'ant-design-vue/es/upload/interface';
  import { ref } from 'vue';

  enum Step {
    START,
    Full,
    SLICE,
    EXR,
  }

  const emit = defineEmits<{
    (event: 'ok', base64: string, trans: number): void;
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
  const transparencyRef = ref(1);
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
  function handleGotoEXR() {
    fileStringRef.value = '';
    stepRef.value = Step.EXR;
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
    sliceFileList.value = [];
  }

  const localApi = getLocalApi();
  // EXR 上传
  const exrDirectoryRef = ref();
  async function handleExecuteEXR() {
    openLoading();
    if (localApi && exrDirectoryRef.value.length) {
      try {
        const result = await localApi.concatExr(exrDirectoryRef.value);
        if (result) {
          fileStringRef.value = result.toString();
        }
      } catch (err) {
        console.error(err);
        message.error('上传失败！请检查路径是否正确！');
      }
    }
    setTimeout(() => {
      closeLoading();
    });
  }

  function handleOk() {
    emit('ok', fileStringRef.value, transparencyRef.value);
    fileStringRef.value = '';
    stepRef.value = Step.START;
  }

  function handleCancel() {
    emit('cancel');
    stepRef.value = Step.START;
  }
</script>

<style lang="less">
  .upload-background-modal {
    .tip {
      font-size: 12px;
      color: @color-text-4;
    }
    .modal-content {
      padding-top: 20px;
      height: 500px;
    }
    .trans-input {
      width: 70px;
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
      margin: 0 24px;
      width: 150px;
      height: 150px;
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
        width: 100px;
        height: 35px;
        font-size: 12px;
      }
    }
    .exr-upload {
      .ant-space {
        width: 90%;
        padding: 20px;
      }
      .option {
        margin: 0 auto;
        text-align: center;
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
