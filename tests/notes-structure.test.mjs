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
});
