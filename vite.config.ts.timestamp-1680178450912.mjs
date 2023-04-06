// vite.config.ts
import { defineConfig } from "file:///D:/frontend-code/mapEditor/node_modules/.pnpm/vite@4.1.4_7eysqoocob5bfzmeeupeo5aiym/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/frontend-code/mapEditor/node_modules/.pnpm/@vitejs+plugin-vue@4.0.0_vite@4.1.4+vue@3.2.47/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///D:/frontend-code/mapEditor/node_modules/.pnpm/@vitejs+plugin-vue-jsx@3.0.1_vite@4.1.4+vue@3.2.47/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import path from "path";
import AutoImport from "file:///D:/frontend-code/mapEditor/node_modules/.pnpm/unplugin-auto-import@0.15.2_@vueuse+core@9.13.0/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///D:/frontend-code/mapEditor/node_modules/.pnpm/unplugin-vue-components@0.24.1_vue@3.2.47/node_modules/unplugin-vue-components/dist/vite.mjs";
import { ArcoResolver } from "file:///D:/frontend-code/mapEditor/node_modules/.pnpm/unplugin-vue-components@0.24.1_vue@3.2.47/node_modules/unplugin-vue-components/dist/resolvers.mjs";
var __vite_injected_original_dirname = "D:\\frontend-code\\mapEditor";
var vite_config_default = defineConfig({
  mode: "development",
  server: {
    host: "10.7.0.61"
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src"),
      "#": path.resolve(__vite_injected_original_dirname, "types")
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          prefix: "arco-vue"
        }
      }
    }
  },
  build: {
    target: "chrome87",
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: "src/main.ts",
      formats: ["es"]
    },
    rollupOptions: {
      input: "index.html",
      output: {
        entryFileNames: "[name].js"
      }
    },
    chunkSizeWarningLimit: 2e3
  },
  define: { "process.env": {} },
  optimizeDeps: {
    include: [
      "@vue/runtime-core",
      "@vue/shared"
    ]
  },
  plugins: [
    vue(),
    vueJsx(),
    AutoImport({
      resolvers: [ArcoResolver()],
      dts: "types/auto-import.d.ts"
    }),
    Components({
      resolvers: [
        ArcoResolver({
          resolveIcons: true,
          sideEffect: process.env.NODE_ENV === "production"
        })
      ],
      dts: "types/components.d.ts"
    })
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
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxmcm9udGVuZC1jb2RlXFxcXG1hcEVkaXRvclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcZnJvbnRlbmQtY29kZVxcXFxtYXBFZGl0b3JcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L2Zyb250ZW5kLWNvZGUvbWFwRWRpdG9yL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSc7XG5pbXBvcnQgdnVlSnN4IGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZS1qc3gnO1xuLy8gaW1wb3J0IHsgY3JlYXRlU3R5bGVJbXBvcnRQbHVnaW4gfSBmcm9tICd2aXRlLXBsdWdpbi1zdHlsZS1pbXBvcnQnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgQXV0b0ltcG9ydCBmcm9tICd1bnBsdWdpbi1hdXRvLWltcG9ydC92aXRlJztcbmltcG9ydCBDb21wb25lbnRzIGZyb20gJ3VucGx1Z2luLXZ1ZS1jb21wb25lbnRzL3ZpdGUnO1xuaW1wb3J0IHsgQXJjb1Jlc29sdmVyIH0gZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvcmVzb2x2ZXJzJztcbi8vIGltcG9ydCB7IGV4aXN0c1N5bmMgfSBmcm9tICdmcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIG1vZGU6ICdkZXZlbG9wbWVudCcsXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6ICcxMC43LjAuNjEnLFxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxuICAgICAgJyMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAndHlwZXMnKSxcbiAgICB9LFxuICB9LFxuICBjc3M6IHtcbiAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XG4gICAgICBsZXNzOiB7XG4gICAgICAgIG1vZGlmeVZhcnM6IHtcbiAgICAgICAgICBwcmVmaXg6ICdhcmNvLXZ1ZScsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgdGFyZ2V0OiAnY2hyb21lODcnLFxuICAgIG91dERpcjogJ2Rpc3QnLFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICAgIGxpYjoge1xuICAgICAgZW50cnk6ICdzcmMvbWFpbi50cycsXG4gICAgICBmb3JtYXRzOiBbJ2VzJ10sXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBpbnB1dDogJ2luZGV4Lmh0bWwnLFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnW25hbWVdLmpzJyxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDIwMDAsXG4gIH0sXG4gIGRlZmluZTogeyAncHJvY2Vzcy5lbnYnOiB7fSB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbXG4gICAgICAnQHZ1ZS9ydW50aW1lLWNvcmUnLFxuICAgICAgJ0B2dWUvc2hhcmVkJyxcbiAgICBdLFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgdnVlKCksXG4gICAgdnVlSnN4KCksXG4gICAgQXV0b0ltcG9ydCh7XG4gICAgICByZXNvbHZlcnM6IFtBcmNvUmVzb2x2ZXIoKV0sXG4gICAgICBkdHM6ICd0eXBlcy9hdXRvLWltcG9ydC5kLnRzJ1xuICAgIH0pLFxuICAgIENvbXBvbmVudHMoe1xuICAgICAgcmVzb2x2ZXJzOiBbXG4gICAgICAgIEFyY29SZXNvbHZlcih7XG4gICAgICAgICAgcmVzb2x2ZUljb25zOiB0cnVlLFxuICAgICAgICAgIHNpZGVFZmZlY3Q6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicsXG4gICAgICAgIH0pLFxuICAgICAgXSxcbiAgICAgIGR0czogJ3R5cGVzL2NvbXBvbmVudHMuZC50cydcbiAgICB9KSxcbiAgICAvLyBjcmVhdGVTdHlsZUltcG9ydFBsdWdpbih7XG4gICAgLy8gICBsaWJzOiBbXG4gICAgLy8gICAgIHtcbiAgICAvLyAgICAgICBsaWJyYXJ5TmFtZTogJ0BhcmNvLWRlc2lnbi93ZWItdnVlJyxcbiAgICAvLyAgICAgICBlc01vZHVsZTogdHJ1ZSxcbiAgICAvLyAgICAgICByZXNvbHZlU3R5bGU6IChuYW1lKSA9PiB7XG4gICAgLy8gICAgICAgICAvLyBjc3NcbiAgICAvLyAgICAgICAgIHJldHVybiBnZXRBcmNvU3R5bGVQYXRoKG5hbWUpO1xuICAgIC8vICAgICAgIH0sXG4gICAgLy8gICAgIH0sXG4gICAgLy8gICBdLFxuICAgIC8vIH0pLFxuICBdLFxufSk7XG5cbi8vIGZ1bmN0aW9uIGdldEFyY29TdHlsZVBhdGgobmFtZSkge1xuLy8gICBjb25zdCBuYW1lcyA9IG5hbWUuc3BsaXQoJy0nKTtcbi8vICAgY29uc3QgYXJjb1BhdGggPSBgQGFyY28tZGVzaWduL3dlYi12dWUvZXMvJHtuYW1lfS9zdHlsZS9pbmRleC5jc3NgO1xuXG4vLyAgIGlmIChleGlzdHNTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy8nICsgYXJjb1BhdGgpKSkge1xuLy8gICAgIHJldHVybiBhcmNvUGF0aDtcbi8vICAgfSBlbHNlIHtcbi8vICAgICBuYW1lcy5wb3AoKTtcbi8vICAgICByZXR1cm4gbmFtZXMubGVuZ3RoID8gZ2V0QXJjb1N0eWxlUGF0aChuYW1lcy5qb2luKCctJykpIDogJyc7XG4vLyAgIH1cbi8vIH1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBc1EsU0FBUyxvQkFBb0I7QUFDblMsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sWUFBWTtBQUVuQixPQUFPLFVBQVU7QUFDakIsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxnQkFBZ0I7QUFDdkIsU0FBUyxvQkFBb0I7QUFQN0IsSUFBTSxtQ0FBbUM7QUFVekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsTUFBTTtBQUFBLEVBQ04sUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxNQUNsQyxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxLQUFLO0FBQUEsSUFDSCxxQkFBcUI7QUFBQSxNQUNuQixNQUFNO0FBQUEsUUFDSixZQUFZO0FBQUEsVUFDVixRQUFRO0FBQUEsUUFDVjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLElBQ2IsS0FBSztBQUFBLE1BQ0gsT0FBTztBQUFBLE1BQ1AsU0FBUyxDQUFDLElBQUk7QUFBQSxJQUNoQjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLE1BQ1AsUUFBUTtBQUFBLFFBQ04sZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsSUFDQSx1QkFBdUI7QUFBQSxFQUN6QjtBQUFBLEVBQ0EsUUFBUSxFQUFFLGVBQWUsQ0FBQyxFQUFFO0FBQUEsRUFDNUIsY0FBYztBQUFBLElBQ1osU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQSxJQUNKLE9BQU87QUFBQSxJQUNQLFdBQVc7QUFBQSxNQUNULFdBQVcsQ0FBQyxhQUFhLENBQUM7QUFBQSxNQUMxQixLQUFLO0FBQUEsSUFDUCxDQUFDO0FBQUEsSUFDRCxXQUFXO0FBQUEsTUFDVCxXQUFXO0FBQUEsUUFDVCxhQUFhO0FBQUEsVUFDWCxjQUFjO0FBQUEsVUFDZCxZQUFZLFFBQVEsSUFBSSxhQUFhO0FBQUEsUUFDdkMsQ0FBQztBQUFBLE1BQ0g7QUFBQSxNQUNBLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWFIO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
