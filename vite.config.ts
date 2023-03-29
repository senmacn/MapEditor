import { defineConfig, splitVendorChunkPlugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createStyleImportPlugin } from 'vite-plugin-style-import';
import path from 'path';

export default defineConfig({
  mode: 'development',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
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
    createStyleImportPlugin({
      libs: [
        {
          libraryName: '@arco-design/web-vue',
          esModule: true,
          resolveStyle: (name) => {
            // less
            return `@arco-design/web-vue/es/${name}/style/index.js`;
          },
        },
      ],
    }),
    splitVendorChunkPlugin(),
  ],
});
