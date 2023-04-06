import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
// import { createStyleImportPlugin } from 'vite-plugin-style-import';
import path from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ArcoResolver } from 'unplugin-vue-components/resolvers';
// import { existsSync } from 'fs';

export default defineConfig({
  mode: 'development',
  server: {
    host: '10.7.0.61',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '#': path.resolve(__dirname, 'types'),
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
    chunkSizeWarningLimit: 2000,
  },
  define: { 'process.env': {} },
  optimizeDeps: {
    include: [
      '@vue/runtime-core',
      '@vue/shared',
    ],
  },
  plugins: [
    vue(),
    vueJsx(),
    AutoImport({
      resolvers: [ArcoResolver()],
      dts: 'types/auto-import.d.ts'
    }),
    Components({
      resolvers: [
        ArcoResolver({
          resolveIcons: true,
          sideEffect: process.env.NODE_ENV === 'production',
        }),
      ],
      dts: 'types/components.d.ts'
    }),
    // createStyleImportPlugin({
    //   libs: [
    //     {
    //       libraryName: '@arco-design/web-vue',
    //       esModule: true,
    //       resolveStyle: (name) => {
    //         // css
    //         return getArcoStylePath(name);
    //       },
    //     },
    //   ],
    // }),
  ],
});

// function getArcoStylePath(name) {
//   const names = name.split('-');
//   const arcoPath = `@arco-design/web-vue/es/${name}/style/index.css`;

//   if (existsSync(path.join(__dirname, './node_modules/' + arcoPath))) {
//     return arcoPath;
//   } else {
//     names.pop();
//     return names.length ? getArcoStylePath(names.join('-')) : '';
//   }
// }
