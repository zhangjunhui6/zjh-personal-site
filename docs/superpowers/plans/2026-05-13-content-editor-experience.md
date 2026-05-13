# Content Editor Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Keystatic editor, Astro content schema, public content ordering, and first formal Notes entry with the approved content editor experience design.

**Architecture:** Keep Markdown files in Astro content collections and use Keystatic as the editor over those files. Add optional/defaulted schema fields so existing content keeps building, move Notes-specific ordering into a small collection helper, and pass Notes `updated` metadata into the shared content layout without changing the site's visual system.

**Tech Stack:** Astro 5 content collections, Keystatic field schemas, TypeScript helpers, Node built-in test runner, Markdown frontmatter.

---

## File Structure

- Create `tests/collections.test.mjs`: Node tests for published filtering, generic date ordering, Notes pinned ordering, and featured project filtering.
- Modify `src/utils/collections.ts`: add `notesByPinnedThenNewest` while keeping existing helpers.
- Modify `src/content.config.ts`: add `pinned` and `cover` to Notes with safe defaults, and keep Journal/Projects optional/defaulted fields aligned with the spec.
- Modify `keystatic.config.ts`: add Notes `pinned` and `cover`, keep Journal and Projects editing fields aligned with the approved model, and make list columns useful for editor scanning.
- Modify `src/pages/notes/index.astro`: use the Notes-specific ordering helper.
- Modify `src/pages/notes/[...slug].astro`: pass `updated` into `ContentLayout`.
- Modify `src/layouts/ContentLayout.astro`: render an updated date only when provided.
- Create `src/content/notes/start-the-site.md`: formal Notes content for the publish-chain acceptance entry.

---

### Task 1: Add Collection Helper Tests

**Files:**
- Create: `tests/collections.test.mjs`

- [ ] **Step 1: Write the failing tests**

Create `tests/collections.test.mjs`:

```js
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  featuredProjects,
  isPublished,
  newestFirst,
  notesByPinnedThenNewest,
} from '../src/utils/collections.ts';

const entry = (id, data) => ({ id, data });

describe('collection helpers', () => {
  it('filters draft entries from public collections', () => {
    assert.equal(isPublished(entry('public', { draft: false, date: new Date('2026-05-12') })), true);
    assert.equal(isPublished(entry('draft', { draft: true, date: new Date('2026-05-12') })), false);
  });

  it('sorts dated entries newest first and then by id', () => {
    const sorted = newestFirst([
      entry('b', { date: new Date('2026-05-10') }),
      entry('c', { date: new Date('2026-05-12') }),
      entry('a', { date: new Date('2026-05-12') }),
    ]);

    assert.deepEqual(sorted.map((item) => item.id), ['a', 'c', 'b']);
  });

  it('sorts notes with pinned entries first before date and id', () => {
    const sorted = notesByPinnedThenNewest([
      entry('old-pinned', { pinned: true, date: new Date('2026-05-10') }),
      entry('new-unpinned', { pinned: false, date: new Date('2026-05-13') }),
      entry('new-pinned-b', { pinned: true, date: new Date('2026-05-12') }),
      entry('new-pinned-a', { pinned: true, date: new Date('2026-05-12') }),
    ]);

    assert.deepEqual(sorted.map((item) => item.id), [
      'new-pinned-a',
      'new-pinned-b',
      'old-pinned',
      'new-unpinned',
    ]);
  });

  it('keeps featured projects public and newest first', () => {
    const sorted = featuredProjects([
      entry('draft-featured', { featured: true, draft: true, date: new Date('2026-05-13') }),
      entry('older-featured', { featured: true, draft: false, date: new Date('2026-05-10') }),
      entry('newer-featured', { featured: true, draft: false, date: new Date('2026-05-12') }),
      entry('plain', { featured: false, draft: false, date: new Date('2026-05-13') }),
    ]);

    assert.deepEqual(sorted.map((item) => item.id), ['newer-featured', 'older-featured']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail because `notesByPinnedThenNewest` is missing**

Run:

```bash
node --experimental-strip-types --test tests/collections.test.mjs
```

Expected: FAIL with an import error for `notesByPinnedThenNewest`.

---

### Task 2: Implement Notes Ordering Helper

**Files:**
- Modify: `src/utils/collections.ts`
- Test: `tests/collections.test.mjs`

- [ ] **Step 1: Add the helper**

Add this exported function:

```ts
export function notesByPinnedThenNewest(entries: CollectionEntry<'notes'>[]): CollectionEntry<'notes'>[] {
  return [...entries].sort((a, b) => {
    const byPinned = Number(b.data.pinned === true) - Number(a.data.pinned === true);
    if (byPinned !== 0) {
      return byPinned;
    }

    const byDate = b.data.date.valueOf() - a.data.date.valueOf();
    return byDate === 0 ? a.id.localeCompare(b.id) : byDate;
  });
}
```

- [ ] **Step 2: Run helper tests**

Run:

```bash
node --experimental-strip-types --test tests/collections.test.mjs
```

Expected: PASS for all collection helper tests.

---

### Task 3: Align Content And Editor Schemas

**Files:**
- Modify: `src/content.config.ts`
- Modify: `keystatic.config.ts`

- [ ] **Step 1: Update Astro Notes schema**

Set Notes fields to include:

```ts
updated: z.coerce.date().optional(),
pinned: z.boolean().default(false),
cover: z.string().optional(),
```

- [ ] **Step 2: Update Keystatic Notes schema**

Set Notes editor fields to include:

```ts
updated: fields.date({ label: 'Updated' }),
pinned: fields.checkbox({
  label: 'Pinned',
  defaultValue: false,
}),
cover: fields.text({ label: 'Cover' }),
```

- [ ] **Step 3: Add editor list columns**

Set collection columns:

```ts
columns: ['title', 'date', 'draft', 'pinned'],
```

for Notes and keep useful columns for Journal and Projects:

```ts
columns: ['title', 'date', 'draft'],
columns: ['title', 'date', 'status', 'featured'],
```

---

### Task 4: Wire Public Notes Ordering And Updated Display

**Files:**
- Modify: `src/pages/notes/index.astro`
- Modify: `src/pages/notes/[...slug].astro`
- Modify: `src/layouts/ContentLayout.astro`

- [ ] **Step 1: Use the Notes-specific helper**

Change the Notes listing import and query to:

```astro
import { isPublished, notesByPinnedThenNewest } from '@/utils/collections';

const notes = notesByPinnedThenNewest((await getCollection('notes')).filter(isPublished));
```

- [ ] **Step 2: Pass updated date to the layout**

Change the Notes detail layout call to:

```astro
<ContentLayout
  title={entry.data.title}
  description={entry.data.description}
  date={entry.data.date}
  updated={entry.data.updated}
  tags={entry.data.tags}
>
  <Content />
</ContentLayout>
```

- [ ] **Step 3: Render updated date only when present**

Add `updated?: Date` to `ContentLayout` props, destructure it, and render:

```astro
{updated && (
  <time class="mb-3 block text-sm text-[var(--color-muted)]" datetime={updated.toISOString()}>
    更新于 {formatDate(updated)}
  </time>
)}
```

---

### Task 5: Add Formal Notes Acceptance Content

**Files:**
- Create: `src/content/notes/start-the-site.md`

- [ ] **Step 1: Add the formal note**

Create `src/content/notes/start-the-site.md`:

```md
---
title: 让这个个人网站开始运转
description: 一篇正式的开场记录，说明这里会如何放下想法、项目和生活观察。
date: 2026-05-13
tags: [个人网站, 写作]
pinned: true
cover: ''
lang: zh
draft: false
---

这个个人网站终于从“搭起来”走到了“开始使用”的阶段。

我希望它先承担一个很朴素的功能：把一些值得留下来的想法放在稳定的位置。这里会有相对完整的 Notes，也会有更轻一点的 Journal，还会记录一些正在做或已经完成的 Projects。

它不会急着变成一个复杂系统。内容先以 Markdown 存在仓库里，后台负责编辑，提交之后再由部署流程发布出去。这样慢一点，但足够清楚，也更容易长期维护。

接下来我会把这里当成一个日常可用的工作台：写下技术上的判断，记录项目推进时的取舍，也保留生活里偶尔冒出来的观察。网站真正开始运转，不是因为页面已经完成，而是因为它开始承接真实内容。
```

---

### Task 6: Verify Locally

**Files:**
- Read: `package.json`
- Read: `package-lock.json`
- Build artifacts: `dist/`

- [ ] **Step 1: Run focused tests**

Run:

```bash
node --experimental-strip-types --test tests/collections.test.mjs
```

Expected: PASS.

- [ ] **Step 2: Run Astro check**

Run:

```bash
./node_modules/.bin/astro check
```

Expected: exit code 0 with no TypeScript or Astro content errors.

- [ ] **Step 3: Run Astro build**

Run:

```bash
./node_modules/.bin/astro build
```

Expected: exit code 0 and generated static output.

- [ ] **Step 4: Verify dependency versions without npm**

Run:

```bash
node -e "const lock=require('./package-lock.json'); for (const name of ['vite','@tailwindcss/vite','astro']) console.log(name, lock.packages[`node_modules/${name}`]?.version)"
```

Expected: prints installed versions for `vite`, `@tailwindcss/vite`, and `astro`.
