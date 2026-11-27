import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import staleNow from './src/integrations/stale-now';
import { shikiThemes, titleTransformer } from './src/lib/shiki';

// The production address. Canonical links, Open Graph tags, RSS, the sitemap and the resume all
// come from this one value. SITE_URL overrides it, for example once there is a custom domain.
const site = process.env.SITE_URL ?? 'https://richa-kaplesh.vercel.app';

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
