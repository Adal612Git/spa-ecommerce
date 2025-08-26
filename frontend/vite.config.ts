import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import prerender from 'vite-plugin-prerender';
import { fetchProductRoutes } from '../scripts/fetchProductRoutes.js';

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const productRoutes = await fetchProductRoutes(env.VITE_API_URL);

  return {
    plugins: [
      vue({
        template: { transformAssetUrls },
      }),
      quasar(),
      prerender({
        routes: ['/', ...productRoutes],
      }),
    ],
  };
});
