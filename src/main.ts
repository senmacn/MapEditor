import { createApp } from 'vue';
import App from './App.vue';
import router from './routes';
import ArcoVueIcon from '@arco-design/web-vue/es/icon';
import '@arco-design/web-vue/dist/arco.css';
import './style.less';
import contextmenu from 'v-contextmenu';
import 'v-contextmenu/dist/themes/dark.css';
import '@simonwep/pickr/dist/themes/nano.min.css';
import { setupStore } from './store';
import 'virtual:svg-icons-register'

function bootstrap() {
  const app = createApp(App);

  setupStore(app);
  app.use(router);
  app.use(ArcoVueIcon);
  app.use(contextmenu);

  app.mount('#app');
}

bootstrap();
