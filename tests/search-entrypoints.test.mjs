import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

describe('search entrypoints', () => {
  it('defines a reusable search shortcut form that submits to the search page', async () => {
    const component = await source('src/components/SearchShortcut.astro');

    assert.match(component, /action="\/search\/"/);
    assert.match(component, /method="get"/);
    assert.match(component, /name="q"/);
    assert.match(component, /name="type"/);
    assert.match(component, /回车直接查看结果/);
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

  it('keeps technical article code blocks readable in the prose layer', async () => {
    const styles = await source('src/styles/global.css');

    assert.match(styles, /\.prose pre/);
    assert.match(styles, /overflow-x:\s*auto/);
    assert.match(styles, /\.prose pre code/);
    assert.match(styles, /white-space:\s*pre/);
    assert.match(styles, /font-family:\s*"SFMono-Regular"/);
  });
});
