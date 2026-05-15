# Bilingual Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Chinese and English versions of the site with stable Chinese URLs and `/en/` English URLs.

**Architecture:** Add focused i18n helpers for language detection, localized paths, public content slugs, and language filtering. Keep existing Chinese pages as the default route set, add English route files that reuse the same helpers and components, and store translations as Markdown content with shared `translationKey` values.

**Tech Stack:** Astro 5, Astro Content Collections, TypeScript, Node test runner, Tailwind CSS.

---

### Task 1: I18n Helpers

**Files:**
- Create: `src/utils/i18n.ts`
- Create: `tests/i18n.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  contentSlug,
  entriesForLanguage,
  getLanguageFromPathname,
  localizedPath,
} from '../src/utils/i18n.ts';

const entry = (id, data) => ({ id, data });

describe('i18n helpers', () => {
  it('detects root Chinese paths and /en/ English paths', () => {
    assert.equal(getLanguageFromPathname('/'), 'zh');
    assert.equal(getLanguageFromPathname('/notes/git/'), 'zh');
    assert.equal(getLanguageFromPathname('/en/'), 'en');
    assert.equal(getLanguageFromPathname('/en/notes/git/'), 'en');
  });

  it('maps current paths between Chinese root routes and English /en/ routes', () => {
    assert.equal(localizedPath('/', 'en'), '/en/');
    assert.equal(localizedPath('/notes/git/', 'en'), '/en/notes/git/');
    assert.equal(localizedPath('/en/notes/git/', 'zh'), '/notes/git/');
    assert.equal(localizedPath('/en/', 'zh'), '/');
  });

  it('uses translationKey before filename suffixes for public content slugs', () => {
    assert.equal(contentSlug(entry('git-guide-en', { translationKey: 'git-guide' })), 'git-guide');
    assert.equal(contentSlug(entry('docker-guide-en', {})), 'docker-guide');
    assert.equal(contentSlug(entry('personal-site', {})), 'personal-site');
  });

  it('filters entries to the requested language', () => {
    const entries = [
      entry('zh-note', { lang: 'zh' }),
      entry('en-note', { lang: 'en' }),
      entry('implicit-zh', {}),
    ];

    assert.deepEqual(entriesForLanguage(entries, 'zh').map((item) => item.id), ['zh-note', 'implicit-zh']);
    assert.deepEqual(entriesForLanguage(entries, 'en').map((item) => item.id), ['en-note']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:i18n`

Expected: FAIL because `src/utils/i18n.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement `src/utils/i18n.ts` with `getLanguageFromPathname`, `localizedPath`, `contentSlug`, and `entriesForLanguage`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:i18n`

Expected: PASS.

### Task 2: Localized Layout And Components

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/layouts/ContentLayout.astro`
- Modify: `src/components/SiteHeader.astro`
- Modify: `src/components/SiteFooter.astro`
- Modify: `src/components/SearchShortcut.astro`
- Modify: `src/components/ContentCard.astro`
- Modify: `src/components/ProjectCard.astro`
- Modify: `src/components/TableOfContents.astro`
- Modify: `src/utils/dates.ts`

- [ ] **Step 1: Update components**

Pass `lang` through layout and reusable components. Use localized nav labels, footer copy, search labels, table of contents labels, dates, project status labels, canonical URL, and `hreflang` links.

- [ ] **Step 2: Run existing source tests**

Run: `npm test`

Expected: Source tests pass after updating expectations where dynamic i18n replaced literal strings.

### Task 3: Route Sets And Search

**Files:**
- Modify: existing root pages under `src/pages`
- Create: English pages under `src/pages/en`
- Modify: `src/pages/search.json.ts`
- Create: `src/pages/en/search.json.ts`
- Modify: `src/utils/taxonomy.ts`
- Modify: `src/utils/search.ts`

- [ ] **Step 1: Filter root pages to Chinese**

Apply `entriesForLanguage(..., 'zh')` to root listing, archive, tag, search index, and detail pages.

- [ ] **Step 2: Add English routes**

Create `/en/` route files mirroring the Chinese routes, with English fixed UI text and `entriesForLanguage(..., 'en')`.

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: PASS.

### Task 4: Static Markdown Translations

**Files:**
- Modify: existing content frontmatter to include `translationKey`
- Create: English translated Markdown files in `src/content/notes`, `src/content/journal`, and `src/content/projects`

- [ ] **Step 1: Add translation keys**

Add `translationKey` to all existing published entries.

- [ ] **Step 2: Add English translation files**

Create English Markdown files with `lang: en`, `draft: false`, and matching `translationKey`.

- [ ] **Step 3: Run content tests and build**

Run: `npm test`

Run: `npm run build`

Expected: PASS for both commands.
