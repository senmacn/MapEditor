import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// import { createStyleImportPlugin } from 'vite-plugin-style-import';
import path from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ArcoResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
  mode: 'development',
  server: {
    host: '10.7.0.61',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          prefix: 'arco-vue',
        },
      },
    },
  },
  build: {
    target: 'chrome87',
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],
    },
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  define: { 'process.env': {} },
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ArcoResolver()],
    }),
    Components({
      resolvers: [
        ArcoResolver({
          resolveIcons: true,
        }),
      ],
    }),
  ],
});
