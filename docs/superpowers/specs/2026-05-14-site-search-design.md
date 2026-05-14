# Site Search Design

## Context

The site now has collection lists, tags, and archives. The next discovery layer is a search page that can find public Notes, Journal, and Projects content without adding a database or server-side search service.

## Goals

- Add `/search/` as a public search page.
- Add `/search.json` as a static search index generated at build time.
- Search public Notes, Journal, and Projects.
- Match title, description, tags or stack, and body text.
- Support filtering by content type: all, Notes, Journal, Projects.
- Keep the search algorithm testable outside Astro.
- Include search in the main navigation.

## Non-Goals

- No external hosted search service.
- No fuzzy matching, typo correction, ranking analytics, or highlighting engine.
- No admin search controls.
- No private or draft content in the index.

## Design

Create `src/utils/search.ts` with pure helpers for normalization, query tokenization, scoring, excerpts, and filtering. Title matches rank highest, tag or stack matches rank next, description matches after that, and body matches last. A result must match every query token somewhere in its combined searchable text.

Create `src/pages/search.json.ts` as a prerendered endpoint. It gathers published entries from `notes`, `journal`, and `projects`, converts them to `SearchDocument` objects, and returns newest-first JSON.

Create `src/pages/search.astro` with a search input, segmented type filters, result count, and result cards. The page fetches `/search.json` and uses the pure search helper in the client bundle. Query parameters are optional: `?q=...&type=...` can hydrate the initial UI state.

Add `搜索` to the main nav after `归档`.

## Testing

Add `tests/search.test.mjs` for:

- tokenized matching across title, description, tags or stack, and body;
- type filtering;
- result ordering by score and date;
- excerpt creation around the first body match.

Update `npm test` and the CI workflow self-test so search tests run on every PR and main push.
