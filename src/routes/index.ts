import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import defaultEditor from '../views/default-editor/index.vue';
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
  {
    path: '/:pathMatch(.*)',
    redirect: '/home'
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    // Always scroll to the top
    return { top: 0 };
  },
});

export default router;
