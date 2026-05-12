import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import markdoc from '@astrojs/markdoc';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://zjh-personal-site.pages.dev',
  output: 'static',
  adapter: cloudflare({
    imageService: 'compile',
  }),
  integrations: [mdx(), sitemap(), react(), markdoc(), keystatic()],
  vite: {
    plugins: [tailwindcss()],
  },
});
