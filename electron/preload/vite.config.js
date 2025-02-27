import { chrome } from '../../.electron-vendors.cache.json';
import { preload } from 'unplugin-auto-expose';
import { join } from 'node:path';

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
  build: {
    sourcemap: false,
    target: `chrome${chrome}`,
    outDir: 'dist',
    assetsDir: '.',
    minify: process.env.MODE !== 'development',
    lib: {
      entry: 'src/index.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].cjs',
      },
      external: ['path', 'electron'],
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
  plugins: [
    preload.vite(),
    {
      name: 'node-externals',
      resolveId(source) {
        if (['path', 'electron'].includes(source)) {
          return { id: source, external: true };
        }
      },
    },
    ,
  ],
};

export default config;
