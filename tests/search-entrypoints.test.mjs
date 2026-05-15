import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

describe('search entrypoints', () => {
  it('defines a reusable search shortcut form that submits to the search page', async () => {
    const component = await source('src/components/SearchShortcut.astro');

    assert.match(component, /localizedPath\('\/search\/', lang\)/);
    assert.match(component, /method="get"/);
    assert.match(component, /name="q"/);
    assert.match(component, /name="type"/);
    assert.match(component, /uiText\[lang\]/);
    assert.match(component, /text\.searchHint/);
    assert.match(component, /⌕/);
  });

  it('shows search shortcuts on the homepage and content directories', async () => {
    const [home, notes, journal, projects] = await Promise.all([
      source('src/pages/index.astro'),
      source('src/pages/notes/index.astro'),
      source('src/pages/journal/index.astro'),
      source('src/pages/projects/index.astro'),
    ]);

    assert.match(home, /SearchShortcut/);
    assert.match(notes, /collection="notes"/);
    assert.match(journal, /collection="journal"/);
    assert.match(projects, /collection="projects"/);
  });

  it('keeps technical article markdown structure readable in the prose layer', async () => {
    const styles = await source('src/styles/global.css');

    assert.match(styles, /\.prose pre/);
    assert.match(styles, /overflow-x:\s*auto/);
    assert.match(styles, /\.prose pre code/);
    assert.match(styles, /white-space:\s*pre/);
    assert.match(styles, /font-family:\s*"SFMono-Regular"/);
    assert.match(styles, /\.prose ul\s*{[^}]*list-style-type:\s*disc/s);
    assert.match(styles, /\.prose ol\s*{[^}]*list-style-type:\s*decimal/s);
    assert.match(styles, /list-style-position:\s*outside/);
    assert.match(styles, /\.prose ul ul\s*{[^}]*list-style-type:\s*circle/s);
    assert.match(styles, /\.prose ol ol\s*{[^}]*list-style-type:\s*lower-alpha/s);
    assert.match(styles, /\.prose li > p\s*{[^}]*margin:\s*0\.45em 0/s);
  });

  it('renders a table of contents from markdown headings on content detail pages', async () => {
    const [layout, toc, notesPage, journalPage, projectsPage, styles] = await Promise.all([
      source('src/layouts/ContentLayout.astro'),
      source('src/components/TableOfContents.astro'),
      source('src/pages/notes/[...slug].astro'),
      source('src/pages/journal/[...slug].astro'),
      source('src/pages/projects/[...slug].astro'),
      source('src/styles/global.css'),
    ]);

    assert.match(layout, /TableOfContents/);
    assert.match(layout, /headings\?:/);
    assert.match(layout, /<TableOfContents headings=\{visibleHeadings\}/);
    assert.match(toc, /uiText\[lang\]/);
    assert.match(toc, /aria-label=\{text\.tocLabel\}/);
    assert.match(toc, /href=\{`#\$\{heading\.slug\}`\}/);
    assert.match(toc, /toc-link-depth-\$\{heading\.depth\}/);
    assert.match(notesPage, /const \{ Content, headings \} = await render\(entry\);/);
    assert.match(journalPage, /const \{ Content, headings \} = await render\(entry\);/);
    assert.match(projectsPage, /const \{ Content, headings \} = await render\(entry\);/);
    assert.match(styles, /\.content-shell/);
    assert.match(styles, /\.toc-panel/);
    assert.match(styles, /position:\s*sticky/);
    assert.match(styles, /@media \(max-width:\s*1023px\)/);
  });
});
