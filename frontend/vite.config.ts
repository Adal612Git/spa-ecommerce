import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import prerender from 'vite-plugin-prerender';

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    quasar(),
    prerender({
      routes: ['/', '/product/1'],
    }),
  ],
});
