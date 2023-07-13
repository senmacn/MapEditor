import { node } from '../../.electron-vendors.cache.json';
import { join } from 'path';

const PACKAGE_ROOT = __dirname;
const PROJECT_ROOT = join(PACKAGE_ROOT, '../..');

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: PROJECT_ROOT,
  resolve: {
    alias: {
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
    },
  },
  build: {
    target: `node${node}`,
    sourcemap: false,
    outDir: './dist',
    assetsDir: '.',
    minify: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].cjs',
      },
      external: ['path', 'child_process', 'fs', 'electron'],
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
  plugins: [
    {
      name: 'node-externals',
      resolveId(source) {
        if (['path', 'child_process', 'fs', 'electron'].includes(source)) {
          return { id: source, external: true };
        }
      },
    },
  ],
};

export default config;
