# Personal Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first version of a Warm Studio personal website for long-term writing, life notes, and project records.

**Architecture:** Use Astro as a static content site. Markdown/MDX entries live in typed content collections, shared layouts render the Warm Studio visual system, and static routes generate Home, Notes, Journal, Projects, About, RSS, sitemap, and 404 pages. The site is deployable to Cloudflare Pages with `npm run build` and `dist`.

**Tech Stack:** Astro, TypeScript, Markdown/MDX, Tailwind CSS via `@tailwindcss/vite`, Astro content collections, `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/rss`.

---

## Working Directory

Use this as the project root for every command:

```bash
cd /Users/zjh/workspace/personal-sites/zjh-personal-site
```

Reference spec:

```text
docs/superpowers/specs/2026-05-12-personal-site-design.md
```

Official docs checked for current implementation details:

- Astro content collections use `src/content.config.ts`, `defineCollection()`, and local `glob()` loaders.
- Tailwind's current Astro guide uses `tailwindcss` with `@tailwindcss/vite` and `@import "tailwindcss";`.
- Astro MDX, sitemap, and RSS packages are official integrations/helpers.
- Cloudflare Pages builds Astro with `npm run build` and output directory `dist`.

## File Structure

Create or modify these files:

```text
.
├── .gitignore
├── README.md
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── public/
│   └── favicon.svg
├── src/
│   ├── content.config.ts
│   ├── config/
│   │   └── site.ts
│   ├── content/
│   │   ├── notes/
│   │   │   ├── start-here.md
│   │   │   └── building-a-personal-space.md
│   │   ├── journal/
│   │   │   ├── spring-room.md
│   │   │   └── a-small-walk.md
│   │   └── projects/
│   │       ├── personal-site.md
│   │       └── tiny-tools.md
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── ContentLayout.astro
│   ├── components/
│   │   ├── ContentCard.astro
│   │   ├── ProjectCard.astro
│   │   ├── SectionHeading.astro
│   │   ├── SiteFooter.astro
│   │   └── SiteHeader.astro
│   ├── pages/
│   │   ├── 404.astro
│   │   ├── about.astro
│   │   ├── index.astro
│   │   ├── rss.xml.ts
│   │   ├── notes/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── journal/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   └── projects/
│   │       ├── index.astro
│   │       └── [slug].astro
│   ├── styles/
│   │   └── global.css
│   └── utils/
│       ├── collections.ts
│       └── dates.ts
└── docs/
    └── deployment/
        └── cloudflare-pages.md
```

Responsibilities:

- `src/config/site.ts`: single source of truth for site name, URL, navigation, author, and reserved language config.
- `src/content.config.ts`: typed schema for `notes`, `journal`, and `projects`.
- `src/utils/collections.ts`: shared filtering/sorting helpers so pages do not duplicate date and draft logic.
- `src/layouts/*`: shared HTML shell and article layout.
- `src/components/*`: focused visual pieces used by multiple pages.
- `src/pages/*`: route-level composition only.
- `src/styles/global.css`: Tailwind import plus global Warm Studio tokens and readable prose defaults.

---

### Task 1: Project Foundation

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `public/favicon.svg`

- [ ] **Step 1: Initialize git if needed**

Run:

```bash
git rev-parse --is-inside-work-tree || git init
git branch -M main
```

Expected: either `true` from the first command, or a new git repository initialized on `main`.

- [ ] **Step 2: Create package metadata**

Write `package.json`:

```json
{
  "name": "zjh-personal-site",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "check": "astro check"
  },
  "dependencies": {
    "@astrojs/mdx": "latest",
    "@astrojs/rss": "latest",
    "@astrojs/sitemap": "latest",
    "@tailwindcss/vite": "latest",
    "astro": "latest",
    "tailwindcss": "latest"
  },
  "devDependencies": {
    "@astrojs/check": "latest",
    "typescript": "latest"
  }
}
```

- [ ] **Step 3: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and npm exits successfully.

- [ ] **Step 4: Configure Astro**

Write `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://zjh-personal-site.pages.dev',
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 5: Configure TypeScript**

Write `tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 6: Add ignore rules**

Write `.gitignore`:

```gitignore
.astro/
dist/
node_modules/
.env
.env.local
.env.*
```

- [ ] **Step 7: Add a simple favicon**

Write `public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#f4efe7"/>
  <path d="M18 42c7-14 19-20 32-20" fill="none" stroke="#2f5d50" stroke-width="6" stroke-linecap="round"/>
  <circle cx="22" cy="24" r="5" fill="#d77f5f"/>
</svg>
```

- [ ] **Step 8: Add README**

Write `README.md`:

```markdown
# ZJH Personal Site

Warm Studio personal website built with Astro, Markdown/MDX, and Tailwind CSS.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Deployment

Deploy to Cloudflare Pages:

- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`
```

- [ ] **Step 9: Verify foundation**

Run:

```bash
npm run check
```

Expected: Astro type checking starts successfully. It may report missing `src` files until later tasks create the app structure; after Task 2 it must pass.

- [ ] **Step 10: Commit foundation**

Run:

```bash
git add .gitignore README.md package.json package-lock.json astro.config.mjs tsconfig.json public/favicon.svg
git commit -m "chore: initialize astro site foundation"
```

Expected: commit succeeds.

---

### Task 2: Site Config, Content Schema, and Seed Content

**Files:**
- Create: `src/config/site.ts`
- Create: `src/content.config.ts`
- Create: `src/content/notes/start-here.md`
- Create: `src/content/notes/building-a-personal-space.md`
- Create: `src/content/journal/spring-room.md`
- Create: `src/content/journal/a-small-walk.md`
- Create: `src/content/projects/personal-site.md`
- Create: `src/content/projects/tiny-tools.md`
- Create: `src/utils/dates.ts`
- Create: `src/utils/collections.ts`

- [ ] **Step 1: Add site config**

Write `src/config/site.ts`:

```ts
export const site = {
  name: 'ZJH',
  title: 'ZJH 的个人空间',
  description: '一个长期记录技术、生活、项目和想法的个人网站。',
  url: 'https://zjh-personal-site.pages.dev',
  author: 'ZJH',
  defaultLang: 'zh',
  languages: ['zh', 'en'] as const,
  nav: [
    { label: '首页', href: '/' },
    { label: '记录', href: '/notes/' },
    { label: '生活', href: '/journal/' },
    { label: '项目', href: '/projects/' },
    { label: '关于', href: '/about/' },
  ],
};

export type SiteLanguage = (typeof site.languages)[number];
```

- [ ] **Step 2: Add typed content collections**

Write `src/content.config.ts`:

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const baseEntry = {
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  lang: z.enum(['zh', 'en']).default('zh'),
  draft: z.boolean().default(false),
};

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...baseEntry,
    updated: z.coerce.date().optional(),
  }),
});

const journal = defineCollection({
  loader: glob({ base: './src/content/journal', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...baseEntry,
    mood: z.string().optional(),
    location: z.string().optional(),
    images: z.array(z.string()).default([]),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    status: z.enum(['active', 'paused', 'finished', 'archive']).default('active'),
    stack: z.array(z.string()).default([]),
    links: z
      .array(
        z.object({
          label: z.string(),
          href: z.string().url(),
        }),
      )
      .default([]),
    cover: z.string().optional(),
    featured: z.boolean().default(false),
    lang: z.enum(['zh', 'en']).default('zh'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes, journal, projects };
```

- [ ] **Step 3: Add date helpers**

Write `src/utils/dates.ts`:

```ts
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
```

- [ ] **Step 4: Add collection helpers**

Write `src/utils/collections.ts`:

```ts
import type { CollectionEntry } from 'astro:content';

type DatedEntry =
  | CollectionEntry<'notes'>
  | CollectionEntry<'journal'>
  | CollectionEntry<'projects'>;

export function isPublished<T extends DatedEntry>(entry: T): boolean {
  return entry.data.draft !== true;
}

export function newestFirst<T extends DatedEntry>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function featuredProjects(entries: CollectionEntry<'projects'>[]): CollectionEntry<'projects'>[] {
  return newestFirst(entries.filter((entry) => entry.data.featured && isPublished(entry)));
}
```

- [ ] **Step 5: Add seed notes**

Write `src/content/notes/start-here.md`:

```markdown
---
title: 从这里开始
description: 第一篇记录，用来说明这个空间会如何慢慢生长。
date: 2026-05-12
tags: [个人网站, 记录]
lang: zh
draft: false
---

这是一个新的个人空间。它会先从少量真实内容开始：一些技术笔记，一些生活观察，一些项目记录。

我希望它不是一张静态名片，而是一个能持续更新的小房间。
```

Write `src/content/notes/building-a-personal-space.md`:

```markdown
---
title: 为什么重新做一个个人网站
description: 个人网站不是为了展示全部，而是为了留下可以被重新发现的线索。
date: 2026-05-12
tags: [写作, 网站]
lang: zh
draft: false
---

很多内容会被时间流冲走。个人网站的好处是，它可以按照自己的节奏组织内容。

这里会放更完整的想法，也会保留一些还在形成中的问题。
```

- [ ] **Step 6: Add seed journal entries**

Write `src/content/journal/spring-room.md`:

```markdown
---
title: 春天的房间
description: 一个关于空间、光线和重新开始的小记录。
date: 2026-05-12
mood: 安静
location: Shanghai
images: []
tags: [生活, 房间]
lang: zh
draft: false
---

整理房间的时候，会顺便整理一部分注意力。

这个网站也从这样的状态开始：先把能放下来的东西放好。
```

Write `src/content/journal/a-small-walk.md`:

```markdown
---
title: 一小段散步
description: 路上想到的几句话。
date: 2026-05-11
mood: 松弛
location: Shanghai
images: []
tags: [散步, 观察]
lang: zh
draft: false
---

散步的好处是不用立刻产出什么。

有些想法要在没有目的的时候才会出现。
```

- [ ] **Step 7: Add seed project entries**

Write `src/content/projects/personal-site.md`:

```markdown
---
title: 个人网站
description: 用 Astro 和 Markdown 搭建一个长期记录型个人空间。
date: 2026-05-12
status: active
stack: [Astro, TypeScript, Tailwind CSS, Cloudflare Pages]
links: []
featured: true
lang: zh
draft: false
---

这个项目的目标不是做一个复杂的网站，而是建立一个低维护、可持续写作和展示的地方。
```

Write `src/content/projects/tiny-tools.md`:

```markdown
---
title: Tiny Tools
description: 一组用于改善日常工作流的小工具实验。
date: 2026-05-10
status: active
stack: [TypeScript]
links: []
featured: true
lang: zh
draft: false
---

把重复的小摩擦变成工具，是一种很适合长期积累的创作方式。
```

- [ ] **Step 8: Verify content schema**

Run:

```bash
npm run check
```

Expected: `astro check` completes without content schema errors.

- [ ] **Step 9: Commit content foundation**

Run:

```bash
git add src/config src/content.config.ts src/content src/utils
git commit -m "feat: add typed content collections"
```

Expected: commit succeeds.

---

### Task 3: Warm Studio Layout and Global Styles

**Files:**
- Create: `src/styles/global.css`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/layouts/ContentLayout.astro`
- Create: `src/components/SiteHeader.astro`
- Create: `src/components/SiteFooter.astro`
- Create: `src/components/SectionHeading.astro`

- [ ] **Step 1: Add global styles**

Write `src/styles/global.css`:

```css
@import "tailwindcss";

:root {
  color-scheme: light;
  --color-ink: #1f2a24;
  --color-muted: #68756f;
  --color-paper: #faf7f0;
  --color-surface: #fffdf8;
  --color-line: #e5ded2;
  --color-leaf: #2f5d50;
  --color-clay: #d77f5f;
  --color-sky: #dce9ef;
  --font-sans: "Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  --font-serif: "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", serif;
}

* {
  box-sizing: border-box;
}

html {
  background: var(--color-paper);
  color: var(--color-ink);
  font-family: var(--font-sans);
  letter-spacing: 0;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(220, 233, 239, 0.5), transparent 360px),
    var(--color-paper);
}

a {
  color: inherit;
  text-decoration-color: rgba(47, 93, 80, 0.35);
  text-underline-offset: 0.2em;
}

a:hover {
  color: var(--color-leaf);
}

.container {
  width: min(100% - 32px, 1080px);
  margin-inline: auto;
}

.prose {
  max-width: 720px;
  font-size: 1.05rem;
  line-height: 1.9;
}

.prose h1,
.prose h2,
.prose h3 {
  line-height: 1.25;
  letter-spacing: 0;
}

.prose p {
  margin: 1.1em 0;
}

.quiet-card {
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: rgba(255, 253, 248, 0.78);
  box-shadow: 0 18px 48px rgba(78, 68, 52, 0.08);
}
```

- [ ] **Step 2: Add site header**

Write `src/components/SiteHeader.astro`:

```astro
---
import { site } from '@/config/site';

const currentPath = Astro.url.pathname;
---

<header class="container flex items-center justify-between py-6">
  <a class="text-lg font-semibold no-underline" href="/" aria-label="返回首页">
    {site.name}
  </a>
  <nav class="flex flex-wrap items-center justify-end gap-4 text-sm text-[var(--color-muted)]" aria-label="主导航">
    {site.nav.map((item) => (
      <a
        class:list={[
          'no-underline transition-colors',
          currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href))
            ? 'text-[var(--color-ink)]'
            : 'hover:text-[var(--color-leaf)]',
        ]}
        href={item.href}
      >
        {item.label}
      </a>
    ))}
  </nav>
</header>
```

- [ ] **Step 3: Add site footer**

Write `src/components/SiteFooter.astro`:

```astro
---
import { site } from '@/config/site';
const year = new Date().getFullYear();
---

<footer class="container mt-20 border-t border-[var(--color-line)] py-8 text-sm text-[var(--color-muted)]">
  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <p>© {year} {site.author}. 用文字和小项目慢慢整理生活。</p>
    <a href="/rss.xml">RSS</a>
  </div>
</footer>
```

- [ ] **Step 4: Add section heading component**

Write `src/components/SectionHeading.astro`:

```astro
---
interface Props {
  eyebrow?: string;
  title: string;
  href?: string;
}

const { eyebrow, title, href } = Astro.props;
---

<div class="mb-5 flex items-end justify-between gap-4">
  <div>
    {eyebrow && <p class="mb-2 text-xs font-semibold uppercase text-[var(--color-clay)]">{eyebrow}</p>}
    <h2 class="m-0 text-2xl font-semibold md:text-3xl">{title}</h2>
  </div>
  {href && <a class="text-sm text-[var(--color-muted)]" href={href}>查看全部</a>}
</div>
```

- [ ] **Step 5: Add base layout**

Write `src/layouts/BaseLayout.astro`:

```astro
---
import SiteFooter from '@/components/SiteFooter.astro';
import SiteHeader from '@/components/SiteHeader.astro';
import { site } from '@/config/site';
import '@/styles/global.css';

interface Props {
  title?: string;
  description?: string;
}

const title = Astro.props.title ? `${Astro.props.title} · ${site.name}` : site.title;
const description = Astro.props.description ?? site.description;
---

<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary" />
    <link rel="icon" href="/favicon.svg" />
    <link rel="alternate" type="application/rss+xml" title={`${site.name} RSS`} href="/rss.xml" />
    <title>{title}</title>
  </head>
  <body>
    <SiteHeader />
    <main>
      <slot />
    </main>
    <SiteFooter />
  </body>
</html>
```

- [ ] **Step 6: Add content layout**

Write `src/layouts/ContentLayout.astro`:

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { formatDate } from '@/utils/dates';

interface Props {
  title: string;
  description: string;
  date: Date;
  tags?: string[];
}

const { title, description, date, tags = [] } = Astro.props;
---

<BaseLayout title={title} description={description}>
  <article class="container py-12">
    <header class="mb-10 max-w-3xl">
      <p class="mb-3 text-sm text-[var(--color-muted)]">{formatDate(date)}</p>
      <h1 class="m-0 text-4xl font-semibold leading-tight md:text-5xl">{title}</h1>
      <p class="mt-5 text-lg leading-8 text-[var(--color-muted)]">{description}</p>
      {tags.length > 0 && (
        <div class="mt-6 flex flex-wrap gap-2">
          {tags.map((tag) => <span class="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-muted)]">{tag}</span>)}
        </div>
      )}
    </header>
    <div class="prose">
      <slot />
    </div>
  </article>
</BaseLayout>
```

- [ ] **Step 7: Verify layout compile**

Run:

```bash
npm run check
```

Expected: type check passes for layouts and components.

- [ ] **Step 8: Commit layout**

Run:

```bash
git add src/styles src/layouts src/components
git commit -m "feat: add warm studio layout system"
```

Expected: commit succeeds.

---

### Task 4: Cards, Home Page, and Listing Pages

**Files:**
- Create: `src/components/ContentCard.astro`
- Create: `src/components/ProjectCard.astro`
- Create: `src/pages/index.astro`
- Create: `src/pages/notes/index.astro`
- Create: `src/pages/journal/index.astro`
- Create: `src/pages/projects/index.astro`
- Create: `src/pages/about.astro`

- [ ] **Step 1: Add content card**

Write `src/components/ContentCard.astro`:

```astro
---
import { formatDate } from '@/utils/dates';

interface Props {
  title: string;
  description: string;
  date: Date;
  href: string;
  label?: string;
}

const { title, description, date, href, label } = Astro.props;
---

<article class="quiet-card p-5">
  {label && <p class="mb-3 text-xs font-semibold uppercase text-[var(--color-clay)]">{label}</p>}
  <h3 class="mb-3 mt-0 text-xl font-semibold">
    <a class="no-underline" href={href}>{title}</a>
  </h3>
  <p class="mb-4 leading-7 text-[var(--color-muted)]">{description}</p>
  <time class="text-sm text-[var(--color-muted)]" datetime={date.toISOString()}>{formatDate(date)}</time>
</article>
```

- [ ] **Step 2: Add project card**

Write `src/components/ProjectCard.astro`:

```astro
---
interface Props {
  title: string;
  description: string;
  href: string;
  stack: string[];
  status: string;
}

const { title, description, href, stack, status } = Astro.props;
---

<article class="quiet-card p-5">
  <p class="mb-3 text-xs font-semibold uppercase text-[var(--color-clay)]">{status}</p>
  <h3 class="mb-3 mt-0 text-xl font-semibold">
    <a class="no-underline" href={href}>{title}</a>
  </h3>
  <p class="mb-4 leading-7 text-[var(--color-muted)]">{description}</p>
  <div class="flex flex-wrap gap-2">
    {stack.map((item) => <span class="rounded-full bg-[var(--color-sky)] px-3 py-1 text-xs text-[var(--color-ink)]">{item}</span>)}
  </div>
</article>
```

- [ ] **Step 3: Add home page**

Write `src/pages/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import ContentCard from '@/components/ContentCard.astro';
import ProjectCard from '@/components/ProjectCard.astro';
import SectionHeading from '@/components/SectionHeading.astro';
import BaseLayout from '@/layouts/BaseLayout.astro';
import { featuredProjects, isPublished, newestFirst } from '@/utils/collections';

const notes = newestFirst((await getCollection('notes')).filter(isPublished)).slice(0, 3);
const journal = newestFirst((await getCollection('journal')).filter(isPublished)).slice(0, 2);
const projects = featuredProjects(await getCollection('projects')).slice(0, 2);
---

<BaseLayout>
  <section class="container grid gap-10 py-14 md:grid-cols-[1.2fr_0.8fr] md:items-end">
    <div>
      <p class="mb-4 text-sm font-semibold uppercase text-[var(--color-clay)]">Warm Studio</p>
      <h1 class="m-0 max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">
        记录技术、生活和正在形成的想法。
      </h1>
    </div>
    <div class="quiet-card p-6">
      <p class="m-0 leading-8 text-[var(--color-muted)]">
        这里会放一些慢慢写下来的文章、生活片段和项目实验。不是为了展示全部，而是为了给长期积累留一个稳定的位置。
      </p>
    </div>
  </section>

  <section class="container py-10">
    <SectionHeading eyebrow="Notes" title="最近写下" href="/notes/" />
    <div class="grid gap-4 md:grid-cols-3">
      {notes.map((entry) => (
        <ContentCard title={entry.data.title} description={entry.data.description} date={entry.data.date} href={`/notes/${entry.id}/`} />
      ))}
    </div>
  </section>

  <section class="container py-10">
    <SectionHeading eyebrow="Journal" title="生活切片" href="/journal/" />
    <div class="grid gap-4 md:grid-cols-2">
      {journal.map((entry) => (
        <ContentCard title={entry.data.title} description={entry.data.description} date={entry.data.date} href={`/journal/${entry.id}/`} />
      ))}
    </div>
  </section>

  <section class="container py-10">
    <SectionHeading eyebrow="Projects" title="正在做的事" href="/projects/" />
    <div class="grid gap-4 md:grid-cols-2">
      {projects.map((entry) => (
        <ProjectCard title={entry.data.title} description={entry.data.description} href={`/projects/${entry.id}/`} stack={entry.data.stack} status={entry.data.status} />
      ))}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 4: Add notes listing**

Write `src/pages/notes/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import ContentCard from '@/components/ContentCard.astro';
import BaseLayout from '@/layouts/BaseLayout.astro';
import { isPublished, newestFirst } from '@/utils/collections';

const notes = newestFirst((await getCollection('notes')).filter(isPublished));
---

<BaseLayout title="记录" description="文章、技术笔记、读书想法和长期思考。">
  <section class="container py-12">
    <h1 class="mb-4 text-4xl font-semibold">记录</h1>
    <p class="mb-8 max-w-2xl leading-8 text-[var(--color-muted)]">文章、技术笔记、读书想法和一些还在形成中的问题。</p>
    <div class="grid gap-4 md:grid-cols-2">
      {notes.map((entry) => (
        <ContentCard title={entry.data.title} description={entry.data.description} date={entry.data.date} href={`/notes/${entry.id}/`} />
      ))}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 5: Add journal listing**

Write `src/pages/journal/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import ContentCard from '@/components/ContentCard.astro';
import BaseLayout from '@/layouts/BaseLayout.astro';
import { isPublished, newestFirst } from '@/utils/collections';

const entries = newestFirst((await getCollection('journal')).filter(isPublished));
---

<BaseLayout title="生活" description="生活记录、影像、旅行和碎片化观察。">
  <section class="container py-12">
    <h1 class="mb-4 text-4xl font-semibold">生活</h1>
    <p class="mb-8 max-w-2xl leading-8 text-[var(--color-muted)]">一些生活里的片段、散步、房间、旅行和观察。</p>
    <div class="grid gap-4 md:grid-cols-2">
      {entries.map((entry) => (
        <ContentCard title={entry.data.title} description={entry.data.description} date={entry.data.date} href={`/journal/${entry.id}/`} />
      ))}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 6: Add project listing**

Write `src/pages/projects/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import ProjectCard from '@/components/ProjectCard.astro';
import BaseLayout from '@/layouts/BaseLayout.astro';
import { isPublished, newestFirst } from '@/utils/collections';

const projects = newestFirst((await getCollection('projects')).filter(isPublished));
---

<BaseLayout title="项目" description="小工具、实验项目和作品记录。">
  <section class="container py-12">
    <h1 class="mb-4 text-4xl font-semibold">项目</h1>
    <p class="mb-8 max-w-2xl leading-8 text-[var(--color-muted)]">一些正在做的小工具、网站实验和长期项目。</p>
    <div class="grid gap-4 md:grid-cols-2">
      {projects.map((entry) => (
        <ProjectCard title={entry.data.title} description={entry.data.description} href={`/projects/${entry.id}/`} stack={entry.data.stack} status={entry.data.status} />
      ))}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 7: Add about page**

Write `src/pages/about.astro`:

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
---

<BaseLayout title="关于" description="关于 ZJH 和这个个人空间。">
  <section class="container grid gap-10 py-12 md:grid-cols-[0.8fr_1.2fr]">
    <div>
      <p class="mb-3 text-sm font-semibold uppercase text-[var(--color-clay)]">About</p>
      <h1 class="m-0 text-4xl font-semibold">关于这个空间</h1>
    </div>
    <div class="prose">
      <p>这里是 ZJH 的个人网站，用来长期记录技术、生活、项目和一些阶段性的想法。</p>
      <p>第一版会保持简单：把内容写下来，把页面做得舒服，把结构留给未来慢慢扩展。</p>
      <p>联系方式和更多个人信息会在内容稳定后补充。</p>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 8: Verify routes**

Run:

```bash
npm run check
```

Expected: type check passes for home and listing pages.

- [ ] **Step 9: Commit pages**

Run:

```bash
git add src/components/ContentCard.astro src/components/ProjectCard.astro src/pages/index.astro src/pages/notes/index.astro src/pages/journal/index.astro src/pages/projects/index.astro src/pages/about.astro
git commit -m "feat: add home and collection listing pages"
```

Expected: commit succeeds.

---

### Task 5: Detail Pages, RSS, 404, and Deployment Notes

**Files:**
- Create: `src/pages/notes/[slug].astro`
- Create: `src/pages/journal/[slug].astro`
- Create: `src/pages/projects/[slug].astro`
- Create: `src/pages/rss.xml.ts`
- Create: `src/pages/404.astro`
- Create: `docs/deployment/cloudflare-pages.md`

- [ ] **Step 1: Add note detail route**

Write `src/pages/notes/[slug].astro`:

```astro
---
import { getCollection, render } from 'astro:content';
import ContentLayout from '@/layouts/ContentLayout.astro';
import { isPublished } from '@/utils/collections';

export async function getStaticPaths() {
  const notes = (await getCollection('notes')).filter(isPublished);
  return notes.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---

<ContentLayout title={entry.data.title} description={entry.data.description} date={entry.data.date} tags={entry.data.tags}>
  <Content />
</ContentLayout>
```

- [ ] **Step 2: Add journal detail route**

Write `src/pages/journal/[slug].astro`:

```astro
---
import { getCollection, render } from 'astro:content';
import ContentLayout from '@/layouts/ContentLayout.astro';
import { isPublished } from '@/utils/collections';

export async function getStaticPaths() {
  const entries = (await getCollection('journal')).filter(isPublished);
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---

<ContentLayout title={entry.data.title} description={entry.data.description} date={entry.data.date} tags={entry.data.tags}>
  <Content />
</ContentLayout>
```

- [ ] **Step 3: Add project detail route**

Write `src/pages/projects/[slug].astro`:

```astro
---
import { getCollection, render } from 'astro:content';
import ContentLayout from '@/layouts/ContentLayout.astro';
import { isPublished } from '@/utils/collections';

export async function getStaticPaths() {
  const projects = (await getCollection('projects')).filter(isPublished);
  return projects.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---

<ContentLayout title={entry.data.title} description={entry.data.description} date={entry.data.date} tags={entry.data.stack}>
  <Content />
</ContentLayout>
```

- [ ] **Step 4: Add RSS feed**

Write `src/pages/rss.xml.ts`:

```ts
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '@/config/site';
import { isPublished, newestFirst } from '@/utils/collections';

export async function GET(context: APIContext) {
  const notes = newestFirst((await getCollection('notes')).filter(isPublished));
  const journal = newestFirst((await getCollection('journal')).filter(isPublished));

  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? new URL(site.url),
    customData: '<language>zh-CN</language>',
    items: [
      ...notes.map((entry) => ({
        title: entry.data.title,
        description: entry.data.description,
        pubDate: entry.data.date,
        link: `/notes/${entry.id}/`,
      })),
      ...journal.map((entry) => ({
        title: entry.data.title,
        description: entry.data.description,
        pubDate: entry.data.date,
        link: `/journal/${entry.id}/`,
      })),
    ],
  });
}
```

- [ ] **Step 5: Add 404 page**

Write `src/pages/404.astro`:

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
---

<BaseLayout title="页面没有找到" description="这个页面不存在或已经移动。">
  <section class="container py-20">
    <p class="mb-3 text-sm font-semibold uppercase text-[var(--color-clay)]">404</p>
    <h1 class="mb-4 text-4xl font-semibold">页面没有找到</h1>
    <p class="mb-8 max-w-xl leading-8 text-[var(--color-muted)]">可能是链接写错了，也可能是这个记录还没有被放进来。</p>
    <a class="rounded-full bg-[var(--color-leaf)] px-5 py-3 text-white no-underline" href="/">回到首页</a>
  </section>
</BaseLayout>
```

- [ ] **Step 6: Add deployment notes**

Write `docs/deployment/cloudflare-pages.md`:

```markdown
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
```

- [ ] **Step 7: Verify full static build**

Run:

```bash
npm run build
```

Expected: `astro check` passes and `astro build` writes the production site to `dist`.

- [ ] **Step 8: Commit detail and deployment routes**

Run:

```bash
git add src/pages docs/deployment
git commit -m "feat: add detail routes rss and deployment docs"
```

Expected: commit succeeds.

---

### Task 6: Local QA and Polish Pass

**Files:**
- Modify: `src/styles/global.css`
- Modify: page/component files only if QA reveals spacing, overflow, contrast, or build issues.

- [ ] **Step 1: Start dev server**

Run:

```bash
npm run dev
```

Expected: Astro starts a local server, usually at `http://localhost:4321`.

- [ ] **Step 2: Browser check desktop**

Open:

```text
http://localhost:4321
```

Check:

- Header navigation is readable.
- Hero text fits without overlap.
- Notes, Journal, and Projects sections show content.
- Cards do not nest inside other cards.
- Colors read as warm and varied, not one single hue.

- [ ] **Step 3: Browser check mobile**

Use a mobile-width viewport around `390x844`.

Check:

- Navigation wraps without overlapping.
- Hero text remains readable.
- Cards stack cleanly.
- Detail pages have comfortable line length.

- [ ] **Step 4: Fix concrete QA issues**

If text is too large on mobile, adjust only the affected Tailwind classes. For example, change:

```astro
<h1 class="m-0 max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">
```

to:

```astro
<h1 class="m-0 max-w-3xl text-4xl font-semibold leading-tight md:text-7xl">
```

If card spacing feels cramped, adjust card padding from:

```astro
<article class="quiet-card p-5">
```

to:

```astro
<article class="quiet-card p-6">
```

- [ ] **Step 5: Run final verification**

Run:

```bash
npm run build
```

Expected: build succeeds and `dist` exists.

- [ ] **Step 6: Commit QA fixes**

Run:

```bash
git status --short
git add src README.md docs
git commit -m "polish: refine responsive personal site"
```

Expected: commit succeeds if there were changes. If there were no changes, skip the commit and record that no QA fixes were needed.

---

## Self-Review

Spec coverage:

- Warm Studio visual direction is implemented by global tokens, layout, hero, and card system in Tasks 3-4.
- Long-term mixed content model is implemented by `notes`, `journal`, and `projects` collections in Task 2.
- Markdown/MDX support is implemented with `@astrojs/mdx` and `glob()` content loaders in Tasks 1-2.
- Home, Notes, Journal, Projects, About, 404, RSS, and sitemap coverage is implemented in Tasks 4-5.
- Cloudflare Pages deployment settings are documented in Task 5.
- Search, comments, CMS, dynamic server features, and full English pages are not implemented, matching first-version scope.

Placeholder scan:

- The plan contains no placeholder markers or undefined feature buckets.
- All commands include expected outcomes.
- All planned created files have concrete content or concrete QA instructions.

Type consistency:

- Collection names are `notes`, `journal`, and `projects` everywhere.
- Route slugs use `entry.id` consistently because the Astro `glob()` loader generates IDs from content filenames.
- Shared helpers accept Astro `CollectionEntry` types and are reused by pages, RSS, and route generation.
