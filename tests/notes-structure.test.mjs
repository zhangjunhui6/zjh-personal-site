import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

describe('notes directory structure', () => {
  it('keeps technical notes in topic directories instead of the notes root', async () => {
    const rootEntries = await readdir(new URL('../src/content/notes/', import.meta.url), {
      withFileTypes: true,
    });

    assert.deepEqual(
      rootEntries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
        .map((entry) => entry.name)
        .sort(),
      [],
    );
  });

  it('places existing articles under stable topic directories', async () => {
    await Promise.all([
      source('src/content/notes/software/tools/git-commit-history-workflow.md'),
      source('src/content/notes/software/devops/docker-daily-development-guide.md'),
      source('src/content/notes/robotics/ros/robot-urdf-modeling-guide.md'),
    ]);
  });

  it('keeps old flat note URLs as redirects to nested topic URLs', async () => {
    const edgeRedirects = await source('public/_redirects');
    const redirects = await Promise.all([
      source('src/pages/notes/git-commit-history-workflow/index.astro'),
      source('src/pages/notes/docker-daily-development-guide/index.astro'),
      source('src/pages/notes/robot-urdf-modeling-guide/index.astro'),
    ]);

    assert.match(
      edgeRedirects,
      /\/notes\/git-commit-history-workflow\/\s+\/notes\/software\/tools\/git-commit-history-workflow\/\s+301/,
    );
    assert.match(
      edgeRedirects,
      /\/notes\/docker-daily-development-guide\/\s+\/notes\/software\/devops\/docker-daily-development-guide\/\s+301/,
    );
    assert.match(
      edgeRedirects,
      /\/notes\/robot-urdf-modeling-guide\/\s+\/notes\/robotics\/ros\/robot-urdf-modeling-guide\/\s+301/,
    );

    assert.match(redirects[0], /Astro\.redirect\('\/notes\/software\/tools\/git-commit-history-workflow\/', 301\)/);
    assert.match(redirects[1], /Astro\.redirect\('\/notes\/software\/devops\/docker-daily-development-guide\/', 301\)/);
    assert.match(redirects[2], /Astro\.redirect\('\/notes\/robotics\/ros\/robot-urdf-modeling-guide\/', 301\)/);
  });

  it('keeps draft-only robotics VLA material out of public notes routes', async () => {
    const notesIndex = await source('src/pages/notes/index.astro');

    assert.doesNotMatch(notesIndex, /\/notes\/robotics\/vla\//);
    assert.doesNotMatch(notesIndex, /docs\/drafts/);
    await assert.rejects(() => source('src/pages/notes/robotics/vla/index.astro'), { code: 'ENOENT' });
    await assert.rejects(() => source('src/pages/notes/robotics/vla/[...slug].astro'), { code: 'ENOENT' });
  });

  it('hides language switching on VLA draft preview routes', async () => {
    const [draftIndex, draftDetail, baseLayout, contentLayout, siteHeader] = await Promise.all([
      source('src/pages/drafts/robotics/vla/index.astro'),
      source('src/pages/drafts/robotics/vla/[...slug].astro'),
      source('src/layouts/BaseLayout.astro'),
      source('src/layouts/ContentLayout.astro'),
      source('src/components/SiteHeader.astro'),
    ]);

    assert.match(draftIndex, /<BaseLayout[\s\S]*showLanguageToggle={false}/);
    assert.match(draftDetail, /<ContentLayout[\s\S]*showLanguageToggle={false}/);
    assert.match(contentLayout, /showLanguageToggle\?: boolean/);
    assert.match(baseLayout, /showLanguageToggle && \([\s\S]*<link rel="alternate" hreflang="en"/);
    assert.match(baseLayout, /<SiteHeader lang={lang} showLanguageToggle={showLanguageToggle} \/>/);
    assert.match(siteHeader, /showLanguageToggle &&/);
  });
});
