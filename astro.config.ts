import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import staleNow from './src/integrations/stale-now';
import { shikiThemes, titleTransformer } from './src/lib/shiki';

// SITE_URL wins (set it once there is a custom domain). On Vercel the production URL is
// provided automatically. Locally the site falls back to localhost.
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL ?? (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:4321');

export default defineConfig({
  site,
  output: 'static',
  integrations: [mdx(), sitemap(), staleNow({ maxAgeDays: 45 })],
  markdown: {
    shikiConfig: { themes: shikiThemes, transformers: [titleTransformer] },
  },
  vite: {
    plugins: [tailwindcss()],
    // Mermaid ships large chunks that load only on posts with a diagram. Nothing else is close.
    build: { chunkSizeWarningLimit: 1600 },
    ssr: { external: ['@resvg/resvg-js'] },
    optimizeDeps: { exclude: ['@resvg/resvg-js'] },
  },
});
