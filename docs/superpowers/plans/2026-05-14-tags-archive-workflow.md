# Tags Archive Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build public tag browsing, archive browsing, and a concise content workflow handbook.

**Architecture:** Keep aggregation logic in `src/utils/taxonomy.ts` and have Astro pages render from that shared shape. Reuse existing layouts and content cards so the new pages feel native to the current site.

**Tech Stack:** Astro 5 content collections, TypeScript utilities, Node test runner, GitHub Actions CI.

---

### Task 1: Taxonomy Tests

**Files:**
- Create: `tests/taxonomy.test.mjs`

- [ ] **Step 1: Write failing tests for tag URLs, summaries, filtering, and archive grouping**

Create tests that import `tagHref`, `collectTagSummaries`, `filterItemsByTag`, and `groupItemsByYear` from `src/utils/taxonomy.ts`.

- [ ] **Step 2: Run taxonomy tests and confirm they fail because the module does not exist**

Run: `node --experimental-strip-types --test tests/taxonomy.test.mjs`

Expected: fail with module-not-found for `src/utils/taxonomy.ts`.

### Task 2: Taxonomy Utility

**Files:**
- Create: `src/utils/taxonomy.ts`

- [ ] **Step 1: Implement normalized tag helpers**

Add `normalizeTag`, `tagSlug`, and `tagHref`.

- [ ] **Step 2: Implement shared content item conversion**

Add `toTaggedContentItems(notes, journal)` that creates items with title, description, date, tags, href, and source label.

- [ ] **Step 3: Implement summaries, filtering, and archive grouping**

Add `collectTagSummaries`, `filterItemsByTag`, and `groupItemsByYear`.

- [ ] **Step 4: Run taxonomy tests and confirm they pass**

Run: `node --experimental-strip-types --test tests/taxonomy.test.mjs`

### Task 3: Pages and Linked Tags

**Files:**
- Create: `src/pages/tags/index.astro`
- Create: `src/pages/tags/[...tag].astro`
- Create: `src/pages/archive.astro`
- Modify: `src/layouts/ContentLayout.astro`
- Modify: `src/config/site.ts`

- [ ] **Step 1: Add `/tags/` tag index**

Fetch published Notes and Journal entries, collect tag summaries, and render linked tag chips with counts.

- [ ] **Step 2: Add `/tags/[tag]/` detail pages**

Generate static paths from tag summaries and render matching entries newest first.

- [ ] **Step 3: Add `/archive/`**

Group shared content items by year and render each year with existing content cards.

- [ ] **Step 4: Link tags on content detail pages**

Render tag chips in `ContentLayout` as links using `tagHref`.

- [ ] **Step 5: Add `归档` to the main nav**

Insert the archive nav item before `关于`.

### Task 4: Content Workflow Handbook and CI

**Files:**
- Create: `docs/content-workflow.md`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `tests/ci-workflow.test.mjs`

- [ ] **Step 1: Write the content workflow handbook**

Document content type choice, field rules, local validation commands, publish checks, and recovery steps.

- [ ] **Step 2: Update npm test scripts**

Make `npm test` run collection, taxonomy, and CI workflow tests.

- [ ] **Step 3: Update CI to run `npm test`**

Keep Astro check and build as separate CI steps.

### Task 5: Verification and Publish

**Files:**
- No source edits unless verification finds issues.

- [ ] **Step 1: Run full local tests**

Run: `npm test`

- [ ] **Step 2: Run Astro validation**

Run: `node ./node_modules/.bin/astro check`

Run: `node ./node_modules/.bin/astro build`

- [ ] **Step 3: Inspect generated output**

Check that `dist/tags/`, `dist/archive/index.html`, article tag links, and sitemap entries exist.

- [ ] **Step 4: Commit, push, and open a PR to `main`**

Use a focused commit message and create a ready PR after verification passes.
