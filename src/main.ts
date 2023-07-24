import { createApp } from 'vue';
import App from './App.vue';
import router from './routes';
import Antd, { message, notification } from 'ant-design-vue';
import 'ant-design-vue/dist/antd.dark.css';
import './style.less';
import contextmenu from 'v-contextmenu';
import 'v-contextmenu/dist/themes/dark.css';
import '@simonwep/pickr/dist/themes/nano.min.css';
import { setupStore } from './store';
import 'virtual:svg-icons-register';
import './utils/extend';
import { getLocalApi } from './utils/env';
import { useLocalState } from './store/modules/local-state';
import loadingSaves from './loadingSaves';
import setCustomDirectives from './directives';
import { useEditorConfig } from './store/modules/editor-config';

notification.config({
  placement: 'topLeft',
});

message.config({
  top: '25px',
});

async function bootstrap() {
  const app = createApp(App);

  setCustomDirectives(app);

  setupStore(app);
  app.use(router);
  app.use(Antd);
  app.use(contextmenu);

  // 本地环境下更新个人配置
  const localApi = getLocalApi();
  const configRef = useEditorConfig();
  if (localApi) {
    const userConfig = await localApi.getUserConfig();
    useLocalState().initUserConfig(Object.assign({}, userConfig));
    userConfig.mapObj && configRef.setMapSize(userConfig.mapObj);
    userConfig.sizeObj && configRef.setSize(userConfig.sizeObj);
  }

  // 加载存档
  await loadingSaves();

  app.mount('#app');
}

bootstrap();
