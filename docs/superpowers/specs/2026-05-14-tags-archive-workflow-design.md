# Tags, Archive, and Content Workflow Design

## Context

The site already separates public writing into Notes, Journal, and Projects. Notes and Journal share dated entries, tags, draft state, and detail pages. The next useful content experience is a way to browse across Notes and Journal by topic and by time, plus a concise editor-facing guide for keeping the Keystatic workflow consistent.

## Goals

- Add a public tag index at `/tags/`.
- Add generated tag detail pages at `/tags/[tag]/`.
- Add a public archive page at `/archive/`.
- Make article tags clickable and point to their tag detail page.
- Add a content workflow handbook for Notes, Journal, and Projects.
- Extend CI coverage so new taxonomy helpers run in automated tests.

## Non-Goals

- Projects will not be included in tag or archive browsing yet. Their metadata model is portfolio-oriented, not writing-oriented.
- No search UI, pagination, or tag management backend is included in this change.
- No Keystatic schema migration is needed because existing content already has tags and dates.

## Design

Create a small `src/utils/taxonomy.ts` module that normalizes tags, builds stable tag URLs, converts published Notes and Journal entries into shared list items, collects tag counts, filters by tag, and groups entries by year. Pages consume those helpers instead of duplicating sorting and grouping logic.

`/tags/` lists all tags from published Notes and Journal content with counts. `/tags/[tag]/` shows entries for one tag, newest first, with a source label. `/archive/` groups the same published entries by year, newest first inside each year. Detail page tag chips become links to the tag detail page.

Navigation adds `归档` because archive is a stable browsing mode. Tags remain discoverable through content tags and the tag index rather than adding another top-level nav item.

## Testing

Add focused Node tests for:

- Percent-encoded tag URLs, including Chinese tags.
- Tag summary counts with trimmed tags and blank tags ignored.
- Tag filtering in newest-first order.
- Archive grouping by descending year and newest-first entries.

Update `npm test` and CI to run all project tests.
