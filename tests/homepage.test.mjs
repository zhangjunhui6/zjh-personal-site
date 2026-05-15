import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

describe('homepage information architecture', () => {
  it('presents the homepage as a search-led navigation hub', async () => {
    const home = await source('src/pages/index.astro');

    assert.match(home, /SearchShortcut/);
    assert.match(home, /搜索这个空间/);
    assert.match(home, /const quickLinks = \[/);
    assert.match(home, /href: '\/notes\/'/);
    assert.match(home, /href: '\/projects\/'/);
    assert.match(home, /href: '\/tags\/'/);
    assert.match(home, /href: '\/archive\/'/);
  });

  it('uses a unified latest stream instead of separate low-value sections', async () => {
    const home = await source('src/pages/index.astro');

    assert.match(home, /const latestEntries = \[/);
    assert.match(home, /最新内容/);
    assert.doesNotMatch(home, /最近写下/);
    assert.doesNotMatch(home, /生活切片/);
    assert.doesNotMatch(home, /关于这里/);
  });

  it('highlights the personal site project as the primary case study', async () => {
    const home = await source('src/pages/index.astro');

    assert.match(home, /entry\.id === 'personal-site'/);
    assert.match(home, /项目案例/);
    assert.match(home, /localizedContentHref\('projects', featuredProject, lang\)/);
  });

  it('removes placeholder content from the public collections', async () => {
    await assert.rejects(() => source('src/content/notes/start-here.md'), { code: 'ENOENT' });
    await assert.rejects(() => source('src/content/notes/start-the-site.md'), { code: 'ENOENT' });
    await assert.rejects(() => source('src/content/notes/building-a-personal-space.md'), { code: 'ENOENT' });
    await assert.rejects(() => source('src/content/projects/tiny-tools.md'), { code: 'ENOENT' });
  });
});
