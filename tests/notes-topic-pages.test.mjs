import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

describe('notes topic index pages', () => {
  it('uses topic URLs, not tag URLs, as the primary notes hub navigation', async () => {
    const noteHub = await source('src/utils/noteHub.ts');

    assert.match(noteHub, /localizedNoteTopicHref/);
    assert.match(noteHub, /prefixToTopicSlug/);
    assert.doesNotMatch(noteHub, /tagHref/);
  });

  it('renders Chinese note detail routes and topic index routes from the same catch-all route', async () => {
    const route = await source('src/pages/notes/[...slug].astro');

    assert.match(route, /buildNoteTopicDomains/);
    assert.match(route, /topicPaths/);
    assert.match(route, /props: \{ topic/);
    assert.match(route, /TopicListLayout/);
    assert.match(route, /ContentLayout/);
  });

  it('keeps English note detail routes and topic index routes aligned', async () => {
    const route = await source('src/pages/en/notes/[...slug].astro');

    assert.match(route, /buildNoteTopicDomains/);
    assert.match(route, /topicPaths/);
    assert.match(route, /props: \{ topic/);
    assert.match(route, /TopicListLayout/);
    assert.match(route, /ContentLayout/);
  });
});
