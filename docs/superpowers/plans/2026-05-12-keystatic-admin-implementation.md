# Keystatic Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a self-use Keystatic CMS at `/keystatic` so the site owner can edit existing Markdown content and publish through GitHub + Cloudflare Pages.

**Architecture:** Add Keystatic as an Astro integration with three collections mapped to the existing `src/content/notes`, `src/content/journal`, and `src/content/projects` folders. Keep public site pages pre-rendered by using Astro hybrid output with the Cloudflare adapter, while Keystatic uses server routes. Support local storage for field smoke tests and GitHub storage for the deployed admin by switching on `KEYSTATIC_STORAGE`.

**Tech Stack:** Astro 6, Keystatic, React integration for the admin UI, Cloudflare adapter, GitHub mode, existing Markdown content collections.

---

## File Structure

- Modify `package.json`: add Keystatic, React, Markdoc, and Cloudflare adapter dependencies.
- Modify `package-lock.json`: lock the new dependency tree after installation.
- Modify `astro.config.mjs`: add React, Markdoc, Keystatic, Cloudflare adapter, and `output: 'hybrid'`.
- Create `keystatic.config.ts`: define storage mode and the `notes`, `journal`, and `projects` collections.
- Modify `.gitignore`: allow committing `.env.example`.
- Create `.env.example`: document the non-secret variable names required locally and on Cloudflare.
- Modify `docs/deployment/cloudflare-pages.md`: record the new adapter/runtime and Keystatic environment variables.

---

### Task 1: Create Implementation Branch And Install Dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Create a feature branch**

Run:

```bash
git switch -c feature/keystatic-admin
```

Expected: branch changes from `main` to `feature/keystatic-admin`.

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install @keystatic/core @keystatic/astro @astrojs/react @astrojs/markdoc @astrojs/cloudflare
```

Expected: `package.json` gains five dependencies and `package-lock.json` updates.

- [ ] **Step 3: Verify dependency tree**

Run:

```bash
npm ls @keystatic/core @keystatic/astro @astrojs/react @astrojs/markdoc @astrojs/cloudflare
```

Expected: all five packages resolve without `UNMET DEPENDENCY`.

- [ ] **Step 4: Commit dependency install**

Run:

```bash
git add package.json package-lock.json
git commit -m "feat: add Keystatic dependencies"
```

Expected: a commit containing only dependency files.

---

### Task 2: Add Keystatic Collection Configuration

**Files:**
- Create: `keystatic.config.ts`
- Modify: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Create `keystatic.config.ts`**

Add this file:

```ts
import { collection, config, fields } from '@keystatic/core';

const repository = 'zhangjunhui6/zjh-personal-site';

const storage =
  process.env.KEYSTATIC_STORAGE === 'github'
    ? { kind: 'github' as const, repo: repository }
    : { kind: 'local' as const };

const languageOptions = [
  { label: '中文', value: 'zh' },
  { label: 'English', value: 'en' },
];

const tagField = fields.array(fields.text({ label: '标签' }), {
  label: '标签',
  itemLabel: (props) => props.value,
});

const markdownContent = fields.markdoc({
  label: '正文',
  extension: 'md',
});

const baseEntryFields = {
  title: fields.slug({
    name: { label: '标题' },
    slug: { label: 'Slug' },
  }),
  description: fields.text({
    label: '摘要',
    multiline: true,
  }),
  date: fields.date({ label: '日期' }),
  tags: tagField,
  lang: fields.select({
    label: '语言',
    options: languageOptions,
    defaultValue: 'zh',
  }),
  draft: fields.checkbox({
    label: '草稿',
    defaultValue: false,
  }),
  content: markdownContent,
};

export default config({
  storage,
  ui: {
    brand: { name: 'ZJH Personal Site' },
  },
  collections: {
    notes: collection({
      label: 'Notes',
      path: 'src/content/notes/*',
      slugField: 'title',
      entryLayout: 'content',
      format: { contentField: 'content' },
      columns: ['title', 'date', 'draft'],
      schema: {
        ...baseEntryFields,
        updated: fields.date({ label: '更新时间' }),
      },
    }),
    journal: collection({
      label: 'Journal',
      path: 'src/content/journal/*',
      slugField: 'title',
      entryLayout: 'content',
      format: { contentField: 'content' },
      columns: ['title', 'date', 'draft'],
      schema: {
        ...baseEntryFields,
        mood: fields.text({ label: '心情' }),
        location: fields.text({ label: '地点' }),
        images: fields.array(fields.text({ label: '图片路径' }), {
          label: '图片',
          itemLabel: (props) => props.value,
        }),
      },
    }),
    projects: collection({
      label: 'Projects',
      path: 'src/content/projects/*',
      slugField: 'title',
      entryLayout: 'content',
      format: { contentField: 'content' },
      columns: ['title', 'date', 'status', 'featured'],
      schema: {
        title: fields.slug({
          name: { label: '标题' },
          slug: { label: 'Slug' },
        }),
        description: fields.text({
          label: '摘要',
          multiline: true,
        }),
        date: fields.date({ label: '日期' }),
        status: fields.select({
          label: '状态',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Paused', value: 'paused' },
            { label: 'Finished', value: 'finished' },
            { label: 'Archive', value: 'archive' },
          ],
          defaultValue: 'active',
        }),
        stack: fields.array(fields.text({ label: '技术项' }), {
          label: '技术栈',
          itemLabel: (props) => props.value,
        }),
        links: fields.array(
          fields.object({
            label: fields.text({ label: '显示名' }),
            href: fields.url({ label: '链接' }),
          }),
          {
            label: '链接',
            itemLabel: (props) => props.fields.label.value,
          },
        ),
        cover: fields.text({ label: '封面路径' }),
        featured: fields.checkbox({
          label: '精选',
          defaultValue: false,
        }),
        lang: fields.select({
          label: '语言',
          options: languageOptions,
          defaultValue: 'zh',
        }),
        draft: fields.checkbox({
          label: '草稿',
          defaultValue: false,
        }),
        content: markdownContent,
      },
    }),
  },
});
```

- [ ] **Step 2: Allow `.env.example` to be committed**

Change `.gitignore` to:

```gitignore
.astro/
dist/
node_modules/
.env
.env.local
.env.*
!.env.example
```

- [ ] **Step 3: Add `.env.example`**

Create `.env.example`:

```dotenv
# Use local for filesystem smoke tests. Use github for deployed admin.
KEYSTATIC_STORAGE=local

# Keystatic GitHub mode values generated by the Keystatic GitHub App setup.
KEYSTATIC_GITHUB_CLIENT_ID=
KEYSTATIC_GITHUB_CLIENT_SECRET=
KEYSTATIC_SECRET=
PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=
```

- [ ] **Step 4: Type-check the config**

Run:

```bash
npm run check
```

Expected: Astro check finishes with `0 errors`.

- [ ] **Step 5: Commit Keystatic config**

Run:

```bash
git add keystatic.config.ts .gitignore .env.example
git commit -m "feat: configure Keystatic collections"
```

Expected: a commit containing the config and env template.

---

### Task 3: Wire Astro Integrations And Cloudflare Adapter

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Update `astro.config.mjs` imports**

Change the file to this complete version:

```js
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
  output: 'hybrid',
  adapter: cloudflare(),
  integrations: [mdx(), sitemap(), react(), markdoc(), keystatic()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 2: Build locally**

Run:

```bash
npm run build
```

Expected:

- Astro check reports `0 errors`.
- Build completes.
- `dist/` contains the public site output.
- The Cloudflare adapter output is generated without crashing.

- [ ] **Step 3: Confirm public files still exist**

Run:

```bash
find dist -maxdepth 3 -type f | sort
```

Expected output includes:

```text
dist/404.html
dist/index.html
dist/notes/index.html
dist/notes/start-here/index.html
dist/journal/index.html
dist/projects/index.html
dist/rss.xml
dist/sitemap-index.xml
```

- [ ] **Step 4: Confirm Vite pin**

Run:

```bash
npm ls vite @tailwindcss/vite astro
```

Expected: `vite@7.3.3` remains installed and overridden.

- [ ] **Step 5: Commit Astro integration wiring**

Run:

```bash
git add astro.config.mjs
git commit -m "feat: wire Keystatic into Astro"
```

Expected: a commit containing only `astro.config.mjs`.

---

### Task 4: Smoke Test Local Keystatic Admin

**Files:**
- Temporarily create and delete: `src/content/notes/keystatic-smoke-test.md`

- [ ] **Step 1: Start the dev server in local storage mode**

Run:

```bash
KEYSTATIC_STORAGE=local npm run dev -- --host 127.0.0.1
```

Expected: Astro dev server starts and prints a local URL, usually `http://127.0.0.1:4321/`.

- [ ] **Step 2: Open the admin**

Open:

```text
http://127.0.0.1:4321/keystatic
```

Expected: Keystatic admin loads without GitHub login because `KEYSTATIC_STORAGE=local`.

- [ ] **Step 3: Verify existing collections are visible**

Expected UI collections:

```text
Notes
Journal
Projects
```

Each collection should show the existing entries from `src/content`.

- [ ] **Step 4: Create a temporary note from the UI**

Create a `Notes` entry with these values:

```text
标题: Keystatic Smoke Test
Slug: keystatic-smoke-test
摘要: 临时后台烟测内容。
日期: 2026-05-12
标签: smoke
语言: zh
草稿: checked
正文: 这是一条临时内容，用来验证 Keystatic 写入 Markdown。
```

Expected file:

```text
src/content/notes/keystatic-smoke-test.md
```

Expected file content:

```md
---
title: Keystatic Smoke Test
description: 临时后台烟测内容。
date: 2026-05-12
tags:
  - smoke
lang: zh
draft: true
---

这是一条临时内容，用来验证 Keystatic 写入 Markdown。
```

- [ ] **Step 5: Run build with the draft present**

Run:

```bash
npm run build
```

Expected: build passes. The draft should not be listed publicly because `draft: true`.

- [ ] **Step 6: Delete the temporary note from the UI**

Delete `Keystatic Smoke Test` from Keystatic.

Expected:

```bash
test ! -f src/content/notes/keystatic-smoke-test.md
```

exits with code `0`.

- [ ] **Step 7: Stop the dev server**

Stop the running dev server with `Ctrl+C`.

- [ ] **Step 8: Commit local admin smoke readiness**

Run:

```bash
git status --short
git add .
git commit -m "test: verify Keystatic local admin"
```

Expected: commit only if the smoke test caused durable config or lockfile changes. If `git status --short` is clean, skip the commit.

---

### Task 5: Configure GitHub Mode Locally

**Files:**
- Do not commit: `.env`

- [ ] **Step 1: Create local `.env` for GitHub mode**

Create `.env` from `.env.example` and set:

```dotenv
KEYSTATIC_STORAGE=github
KEYSTATIC_GITHUB_CLIENT_ID=
KEYSTATIC_GITHUB_CLIENT_SECRET=
KEYSTATIC_SECRET=
PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=
```

Keep the GitHub values blank before the Keystatic setup wizard runs.

- [ ] **Step 2: Start dev server in GitHub mode**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Astro dev server starts and uses `.env`.

- [ ] **Step 3: Open GitHub mode admin**

Open:

```text
http://127.0.0.1:4321/keystatic
```

Expected: Keystatic shows GitHub login/setup UI.

- [ ] **Step 4: Stop for user GitHub App authorization**

Before clicking any button that creates a GitHub App or grants repository access, ask the user to confirm the action in the browser.

Expected user-owned GitHub App settings:

```text
Repository: zhangjunhui6/zjh-personal-site
Callback URL: http://127.0.0.1:4321/keystatic/api/github/oauth/callback
Deployed callback URL: https://zjh-personal-site.pages.dev/keystatic/api/github/oauth/callback
Repository access: only zhangjunhui6/zjh-personal-site
```

- [ ] **Step 5: Copy generated env values into `.env`**

After Keystatic generates local `.env` values, verify `.env` has `KEYSTATIC_STORAGE=github` and non-empty values for `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, and `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`.

Do not commit `.env`.

- [ ] **Step 6: Verify GitHub mode admin loads**

Reload:

```text
http://127.0.0.1:4321/keystatic
```

Expected: GitHub login succeeds for the site owner and shows `Notes`, `Journal`, and `Projects`.

- [ ] **Step 7: Commit documentation updates for GitHub mode**

No code changes are expected in this task. If GitHub setup requires adding the deployed callback URL to docs, defer that exact doc edit to Task 6.

---

### Task 6: Document Cloudflare Environment And Deploy

**Files:**
- Modify: `docs/deployment/cloudflare-pages.md`

- [ ] **Step 1: Update deployment docs**

Append this section to `docs/deployment/cloudflare-pages.md`:

````md
## Keystatic Admin

The admin entrypoint is:

```text
https://zjh-personal-site.pages.dev/keystatic
```

The site uses Keystatic GitHub mode in production. Configure these Cloudflare Pages environment variables before deploying the admin:

- `KEYSTATIC_STORAGE`: set to `github`.
- `KEYSTATIC_GITHUB_CLIENT_ID`: copy from local `.env`.
- `KEYSTATIC_GITHUB_CLIENT_SECRET`: copy from local `.env`.
- `KEYSTATIC_SECRET`: copy from local `.env`.
- `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`: copy from local `.env`.

Do not commit real secret values. The GitHub App should be installed only on `zhangjunhui6/zjh-personal-site`.
````

- [ ] **Step 2: Build before deploy**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 3: Commit deployment documentation**

Run:

```bash
git add docs/deployment/cloudflare-pages.md
git commit -m "docs: document Keystatic deployment"
```

Expected: one docs commit.

- [ ] **Step 4: Push the feature branch**

Run:

```bash
git push -u origin feature/keystatic-admin
```

Expected: branch appears on GitHub.

- [ ] **Step 5: Add Cloudflare Pages environment variables**

In Cloudflare Pages project settings for `zjh-personal-site`, add the five production variables from the local `.env` file:

```text
KEYSTATIC_STORAGE
KEYSTATIC_GITHUB_CLIENT_ID
KEYSTATIC_GITHUB_CLIENT_SECRET
KEYSTATIC_SECRET
PUBLIC_KEYSTATIC_GITHUB_APP_SLUG
```

Expected: variables are saved without exposing secret values in the repository.

- [ ] **Step 6: Merge to main after local verification**

Run:

```bash
git switch main
git pull
git merge --ff-only feature/keystatic-admin
git push origin main
```

Expected: `main` contains the Keystatic admin code and triggers Cloudflare Pages.

- [ ] **Step 7: Trigger a fresh Cloudflare deployment**

Only use Cloudflare Pages "Retry deployment" or push an empty commit if the deployment started before the environment variables were saved:

```bash
git commit --allow-empty -m "chore: redeploy Keystatic admin"
git push origin main
```

Expected: Cloudflare Pages creates a new production deployment.

---

### Task 7: Online Verification

**Files:**
- No expected file changes.

- [ ] **Step 1: Verify Cloudflare deployment status**

In Cloudflare Pages deployments, confirm the latest production deployment is successful and points to the latest `main` commit.

- [ ] **Step 2: Check public routes**

Run:

```bash
node --input-type=module -e 'const base="https://zjh-personal-site.pages.dev"; const paths=["/","/notes/","/journal/","/projects/","/notes/start-here/","/rss.xml","/sitemap-index.xml"]; for (const path of paths) { const res=await fetch(base+path); const text=await res.text(); const canonical=text.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? ""; console.log(`${path}\t${res.status}\t${res.headers.get("content-type")}\t${canonical || (text.includes(base) ? "contains-base" : "")}`); if (!res.ok) process.exitCode=1; if (path.endsWith("/") && canonical !== `${base}${path}`) { console.error(`canonical mismatch for ${path}: ${canonical}`); process.exitCode=1; } }'
```

Expected: all routes return `200`; HTML pages have canonical URLs under `https://zjh-personal-site.pages.dev`.

- [ ] **Step 3: Check admin route**

Open:

```text
https://zjh-personal-site.pages.dev/keystatic
```

Expected: Keystatic admin loads and offers GitHub login.

- [ ] **Step 4: Login as site owner**

Login with the owner GitHub account.

Expected: admin shows `Notes`, `Journal`, and `Projects`.

- [ ] **Step 5: Create and remove an online smoke draft**

Create a `Notes` entry with these values:

```text
标题: Keystatic Online Smoke Test
Slug: keystatic-online-smoke-test
摘要: 临时线上后台烟测内容。
日期: 2026-05-12
标签: smoke
语言: zh
草稿: checked
正文: 这是一条临时线上内容，用来验证 Keystatic GitHub mode。
```

Expected: GitHub receives a content commit and Cloudflare Pages starts a deployment.

After that deployment succeeds, delete `Keystatic Online Smoke Test` from the admin.

Expected: GitHub receives a deletion commit and Cloudflare Pages starts a second deployment.

- [ ] **Step 6: Verify repository and worktree**

Run:

```bash
git fetch origin
git status --short --branch
git log --oneline --max-count=5
```

Expected: local branch can be fast-forwarded to any content commits created by Keystatic, and there are no uncommitted local code changes.

---

## References

- Keystatic Astro installation: `https://keystatic.com/docs/installation-astro`
- Keystatic GitHub mode: `https://keystatic.com/docs/github-mode`
- Keystatic Markdoc `.md` extension: `https://keystatic.com/docs/fields/markdoc`
- Keystatic format options: `https://keystatic.com/docs/format-options`
- Keystatic path organization: `https://keystatic.com/docs/content-organisation`
- Astro on-demand rendering and hybrid/server modes: `https://docs.astro.build/en/guides/on-demand-rendering/`
- Astro Cloudflare adapter: `https://docs.astro.build/en/guides/integrations-guide/cloudflare/`
