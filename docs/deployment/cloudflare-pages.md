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

The project currently uses Astro 5 and pins Vite to `6.4.2` because `@keystatic/astro@5.0.6` supports Astro 2-5. Keep the Vite override until an Astro/Keystatic/Tailwind upgrade is verified with `npm run build`.

Astro uses `output: 'static'` with the Cloudflare adapter. Public content pages remain prerendered, while Keystatic admin and API routes are emitted as Cloudflare Pages Functions. The adapter sets `imageService: 'compile'` so prerendered pages can optimize images at build time without requiring Sharp in the Cloudflare runtime.

Keystatic storage mode is controlled by `PUBLIC_KEYSTATIC_STORAGE`, with `KEYSTATIC_STORAGE` retained as a server-side compatibility fallback. Set both to `github` in Cloudflare Pages production.
