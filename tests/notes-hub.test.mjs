import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

describe('notes topic hub', () => {
  it('drives notes navigation from a reusable topic configuration', async () => {
    const config = await source('src/config/noteTopics.ts');

    assert.match(config, /noteTopicDomains/);
    assert.match(config, /id: 'software'/);
    assert.match(config, /软件工程/);
    assert.match(config, /Software Engineering/);
    assert.match(config, /id: 'robotics'/);
    assert.match(config, /机器人/);
    assert.match(config, /Robotics/);
    assert.match(config, /prefix: 'software\/architecture\/'/);
    assert.match(config, /prefix: 'software\/backend\/'/);
    assert.match(config, /prefix: 'software\/devops\/'/);
    assert.match(config, /prefix: 'robotics\/ros\/'/);
  });

  it('presents the Chinese notes index as a topic hub instead of a flat card wall', async () => {
    const notes = await source('src/pages/notes/index.astro');

    assert.match(notes, /noteTopicDomains/);
    assert.match(notes, /专题导览/);
    assert.match(notes, /domain\.localizedTitle/);
    assert.match(notes, /最新记录/);
    assert.match(notes, /topic\.featuredEntries/);
    assert.doesNotMatch(notes, /ContentCard/);
  });

  it('keeps the English notes index aligned with the same topic hub model', async () => {
    const notes = await source('src/pages/en/notes/index.astro');

    assert.match(notes, /noteTopicDomains/);
    assert.match(notes, /Topic Guide/);
    assert.match(notes, /domain\.localizedTitle/);
    assert.match(notes, /Latest Notes/);
    assert.match(notes, /topic\.featuredEntries/);
    assert.doesNotMatch(notes, /ContentCard/);
  });
});
