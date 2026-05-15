# Bilingual Site Design

## Goal

Make the personal site available in Chinese and English while keeping Chinese URLs stable and using `/en/` for English pages.

## Decisions

- Chinese remains the default language at root paths such as `/`, `/notes/`, and `/projects/`.
- English pages live under `/en/`, including `/en/`, `/en/notes/`, `/en/projects/`, `/en/tags/`, `/en/archive/`, and `/en/search/`.
- Published content is filtered by frontmatter `lang`.
- Translated content is stored as Markdown, not generated at request time.
- Each translated pair uses a shared `translationKey`, so future tooling and reviews can detect missing counterparts.
- English content files may use an `-en.md` filename suffix while publishing the same public slug through `translationKey`.
- The header exposes a language switch that maps the current URL between root Chinese and `/en/` English paths.
- Layout metadata emits localized `html lang`, canonical URL, and `hreflang` alternate links.

## Content Workflow

I will generate the first English version of the existing Chinese content and commit it as Markdown files. Future translations should follow the same workflow: draft a translated Markdown file, review tone and accuracy, then publish it by setting `draft: false`.

Runtime translation APIs are intentionally out of scope. Static Markdown translations keep search, SEO, review, and deployment predictable.

## Testing

- Unit tests cover language path helpers, content slug derivation, and language filtering.
- Existing source tests continue protecting homepage, search, taxonomy, and prose behavior.
- `npm test` and `npm run build` are the final verification gates.
