import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import defaultEditor from '../views/default-editor/default-editor.vue';

const routes: RouteRecordRaw[] = [
  {
    name: 'home',
    path: '/',
    redirect: '/default-editor',
  },
  {
    name: 'default-editor',
    path: '/default-editor',
    component: defaultEditor,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Always scroll to the top
    return { top: 0 };
  },
});

export default router;
