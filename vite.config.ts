import type { ConfigEnv } from 'vite';
import { defineConfig, loadEnv, splitVendorChunkPlugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { renderer } from 'unplugin-auto-expose';
import path from 'path';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';
import { wrapperEnv } from './build/util';
import commpressPlugin from 'vite-plugin-compression';

export default defineConfig(({ mode }: ConfigEnv) => {
  const root = process.cwd();
  const env = loadEnv(mode, root);

  const viteEnv = wrapperEnv(env);
  const { VITE_PORT } = viteEnv;

  return {
    mode: process.env.MODE,
    root: root,
    envDir: root,
    base: '',
    server: {
      https: false,
      host: true,
      port: VITE_PORT,
    },
    resolve: {
      alias: {
        '@': path.resolve(root, 'src'),
        '#': path.resolve(root, 'types'),
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
      target: 'modules',
      outDir: 'dist',
      emptyOutDir: true,
      assetsDir: '.',
      sourcemap: false,
      cssCodeSplit: true,
      minify: 'terser',
      lib: {
        entry: 'src/main.ts',
        formats: ['es'],
      },
      rollupOptions: {
        input: path.join(root, 'index.html'),
        output: {
          entryFileNames: '[name]-[hash].js',
          chunkFileNames: '[name]-[hash].js',
          assetFileNames: '[name]-[hash][extname]',
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
      terserOptions: {
        compress: {
          //生产环境时移除console
          drop_console: true,
          drop_debugger: true,
        },
      },
      chunkSizeWarningLimit: 2000,
    },
    define: { 'process.env': {} },
    optimizeDeps: {
      include: ['@vue/runtime-core', '@vue/shared', 'ant-design-vue/es/locale/zh_CN', 'ant-design-vue/es/locale/en_US'],
    },
    worker: {
      format: 'es',
    },
    plugins: [
      vue(),
      vueJsx(),
      renderer.vite({
        preloadEntry: path.join(root, 'electron/preload/src/index.ts'),
      }),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
        symbolId: 'icon-[name]',
        inject: 'body-last',
        customDomId: '__svg__icons__dom__',
      }),
      splitVendorChunkPlugin(),
      commpressPlugin(),
    ],
  };
});
