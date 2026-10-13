import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: true }
  }),
  vite: {
    resolve: {
      alias: {
        '@db': '/src/lib/db',
        '@lib': '/src/lib',
      },
    },
  },
});
