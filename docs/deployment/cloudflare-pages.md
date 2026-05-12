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
- Node version: use the Cloudflare default unless a build error asks for a newer supported version.

The first public URL can use the free `*.pages.dev` domain. Update `site.url` in `src/config/site.ts` and `site` in `astro.config.mjs` after the final Pages URL or custom domain is known.
