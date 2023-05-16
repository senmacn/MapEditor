import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { renderer } from 'unplugin-auto-expose';
import path from 'path';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';

const PACKAGE_ROOT = __dirname;

export default defineConfig({
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: PACKAGE_ROOT,
  base: '',
  server: {
    host: '10.7.0.61',
    port: 4000,
  },
  resolve: {
    alias: {
      '@': path.resolve(PACKAGE_ROOT, 'src'),
      '#': path.resolve(PACKAGE_ROOT, 'types'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        additionalData: '@import "@/style/_variable.less";',
      },
    },
  },
  build: {
    target: 'chrome87',
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: '.',
    sourcemap: true,
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],
    },
    rollupOptions: {
      input: path.join(PACKAGE_ROOT, 'index.html'),
      output: {
        entryFileNames: '[name].js',
      },
    },
    chunkSizeWarningLimit: 2000,
  },
  define: { 'process.env': {} },
  optimizeDeps: {
    include: [
      '@vue/runtime-core',
      '@vue/shared',
      'ant-design-vue/es/locale/zh_CN',
      'ant-design-vue/es/locale/en_US',
    ],
  },
  plugins: [
    vue(),
    vueJsx(),
    renderer.vite({
      preloadEntry: path.join(PACKAGE_ROOT, 'electron/preload/src/index.ts'),
    }),
    createSvgIconsPlugin({
      iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
      symbolId: 'icon-[name]',
      inject: 'body-last',
      customDomId: '__svg__icons__dom__',
    }),
  ],
});
