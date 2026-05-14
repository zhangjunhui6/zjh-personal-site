# Site Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a static client-side search experience for public Notes, Journal, and Projects content.

**Architecture:** Keep search ranking and filtering in a pure `src/utils/search.ts` module. Generate a prerendered JSON index from Astro content collections, then have `/search/` fetch that index and render results in the browser.

**Tech Stack:** Astro 5, TypeScript, Node test runner, vanilla browser JavaScript bundled by Astro, GitHub Actions CI.

---

### Task 1: Search Helper Tests

**Files:**
- Create: `tests/search.test.mjs`

- [ ] **Step 1: Write failing tests**

Import `createSearchDocument`, `searchDocuments`, and `createSearchExcerpt` from `src/utils/search.ts`. Cover title/tag/body matching, type filtering, score/date ordering, and excerpts.

- [ ] **Step 2: Verify red**

Run: `node --experimental-strip-types --test tests/search.test.mjs`

Expected: fail because `src/utils/search.ts` does not exist.

### Task 2: Search Helper Implementation

**Files:**
- Create: `src/utils/search.ts`

- [ ] **Step 1: Add search document types and normalization**

Define `SearchCollection`, `SearchDocument`, `SearchResult`, `normalizeSearchText`, and `tokenizeSearchQuery`.

- [ ] **Step 2: Add document creation**

Implement `createSearchDocument(input)` to trim tags, remove duplicate tags, and build searchable field text.

- [ ] **Step 3: Add ranking and filtering**

Implement `searchDocuments(documents, query, collection)` with all-token matching, weighted scoring, collection filtering, and deterministic ordering.

- [ ] **Step 4: Add excerpts**

Implement `createSearchExcerpt(text, query, fallback, maxLength)` around the first token match.

- [ ] **Step 5: Verify green**

Run: `node --experimental-strip-types --test tests/search.test.mjs`

### Task 3: Search Index Endpoint

**Files:**
- Create: `src/pages/search.json.ts`

- [ ] **Step 1: Generate a prerendered JSON index**

Fetch published Notes, Journal, and Projects, map them into `SearchDocument` objects, and return JSON sorted newest first.

- [ ] **Step 2: Build-check endpoint**

Run: `node ./node_modules/.bin/astro check`

### Task 4: Search Page

**Files:**
- Create: `src/pages/search.astro`
- Modify: `src/config/site.ts`

- [ ] **Step 1: Add `/search/` UI**

Render a search input, segmented content-type filters, count region, empty state, and result list container.

- [ ] **Step 2: Add client behavior**

Fetch `/search.json`, search using `searchDocuments`, render result cards, and sync `q` and `type` query parameters.

- [ ] **Step 3: Add nav item**

Add `{ label: '搜索', href: '/search/' }` after `归档`.

### Task 5: CI and Verification

**Files:**
- Modify: `package.json`
- Modify: `tests/ci-workflow.test.mjs`

- [ ] **Step 1: Add `test:search`**

Update `npm test` so search tests run with existing tests.

- [ ] **Step 2: Run full verification**

Run: `npm test`, `node ./node_modules/.bin/astro check`, and `node ./node_modules/.bin/astro build`.

- [ ] **Step 3: Inspect output and browser behavior**

Confirm `/search/index.html`, `/search.json`, nav links, and live search interactions.

- [ ] **Step 4: Commit and open PR**

Commit the feature branch, push it, create a PR to `main`, and wait for CI.
