# Search Entrypoints and Git Article Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add search boxes to the homepage and content directory pages, then rewrite the Git article for user review.

**Architecture:** Use one reusable Astro search form component that submits to `/search/` with optional `type` filtering. Keep the Git article as Markdown content in the existing Notes collection.

**Tech Stack:** Astro 5, Markdown content collections, Node test runner, existing static search page.

---

### Task 1: Search Entrypoint Coverage

**Files:**
- Create: `tests/search-entrypoints.test.mjs`
- Create: `src/components/SearchShortcut.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/notes/index.astro`
- Modify: `src/pages/journal/index.astro`
- Modify: `src/pages/projects/index.astro`
- Modify: `package.json`
- Modify: `tests/ci-workflow.test.mjs`

- [x] Write a failing source-level test that requires `SearchShortcut` usage on the homepage and content directories.
- [x] Implement `SearchShortcut.astro` as a GET form to `/search/`, with a hidden `type` field for directory pages.
- [x] Add the component to the homepage, Notes, Journal, and Projects pages.
- [x] Add `test:search-entrypoints` to `npm test`.

### Task 2: Git Article Rewrite

**Files:**
- Modify: `src/content/notes/git-commit-history-workflow.md`

- [x] Replace the current narrow Git-history article with a broader article covering what Git is, common commands and scenarios, daily work practices, and useful tools.
- [x] Add a reference section linking to authoritative Git/GitHub docs and selected tool docs.
- [x] Keep the article published for review on the branch preview, but do not merge without user approval.

### Task 3: Verification and Review PR

**Files:**
- No source edits unless verification finds issues.

- [x] Run `npm test`.
- [x] Run `node ./node_modules/.bin/astro check`.
- [x] Run `node ./node_modules/.bin/astro build`.
- [x] Inspect generated homepage, directory pages, rewritten article, tags, search index, and sitemap.
- [x] Use browser automation to verify homepage and directory search forms navigate with the expected query parameters.
- [ ] Commit, push, and create a draft PR for review.
