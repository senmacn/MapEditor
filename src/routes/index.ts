import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import defaultEditor from '../views/default-editor/default-editor.vue';
import Home from '../views/home/index.vue';

const routes: RouteRecordRaw[] = [
  {
    name: 'home',
    path: '/home',
    component: Home,
  },
  {
    name: 'map-editor',
    path: '/map-editor',
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
