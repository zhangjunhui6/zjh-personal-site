# Cloudflare Pages Deployment

Project root:

```text
/Users/zjh/workspace/personal-sites/zjh-personal-site
```

Cloudflare Pages settings:

- Framework preset: Astro
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Build system version: v3
- Environment variable: `NODE_VERSION=22.16.0`

Production URL:

```text
https://zjh-personal-site.pages.dev
```

This URL is set in `site.url` in `src/config/site.ts` and `site` in `astro.config.mjs`.

The project pins Vite to `7.3.3` because Astro `6.3.1` currently builds against Vite 7, while `@tailwindcss/vite` allows Vite 8. Keep the `vite` override until an Astro/Tailwind upgrade is verified with `npm run build`.
