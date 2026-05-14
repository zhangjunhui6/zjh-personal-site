import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createSearchDocument,
  createSearchExcerpt,
  searchDocuments,
  tokenizeSearchQuery,
} from '../src/utils/search.ts';

const document = (id, overrides = {}) =>
  createSearchDocument({
    id,
    collection: 'notes',
    title: id,
    description: `${id} description`,
    date: '2026-05-12T00:00:00.000Z',
    href: `/notes/${id}/`,
    label: '记录',
    tags: [],
    body: '',
    ...overrides,
  });

describe('search helpers', () => {
  it('tokenizes trimmed queries with stable lowercase text', () => {
    assert.deepEqual(tokenizeSearchQuery('  Astro   Cloudflare  '), ['astro', 'cloudflare']);
    assert.deepEqual(tokenizeSearchQuery('个人网站'), ['个人网站']);
  });

  it('normalizes duplicate tags while creating search documents', () => {
    const entry = document('tags', {
      tags: [' 写作 ', '写作', '', '个人网站'],
    });

    assert.deepEqual(entry.tags, ['写作', '个人网站']);
  });

  it('searches title, description, tags, and body with title matches ranked first', () => {
    const results = searchDocuments(
      [
        document('body-hit', {
          title: '普通记录',
          description: '一篇普通记录',
          body: '这里提到了个人网站的长期维护。',
          date: '2026-05-14T00:00:00.000Z',
        }),
        document('title-hit', {
          title: '个人网站搜索',
          description: '关于内容发现。',
          tags: ['搜索'],
          date: '2026-05-13T00:00:00.000Z',
        }),
      ],
      '个人网站',
    );

    assert.deepEqual(
      results.map((result) => result.id),
      ['title-hit', 'body-hit'],
    );
  });

  it('requires every query token and filters by collection type', () => {
    const results = searchDocuments(
      [
        document('note', {
          title: 'Astro 笔记',
          body: '只提到 Astro。',
        }),
        document('project', {
          collection: 'projects',
          title: '个人网站',
          description: 'Astro 和 Cloudflare Pages 项目。',
          href: '/projects/personal-site/',
          label: '项目',
          tags: ['TypeScript'],
        }),
      ],
      'Astro Cloudflare',
      'projects',
    );

    assert.deepEqual(
      results.map((result) => result.id),
      ['project'],
    );
  });

  it('orders equal-score results by newest date and then id', () => {
    const results = searchDocuments(
      [
        document('b', { title: '搜索', date: '2026-05-12T00:00:00.000Z' }),
        document('a', { title: '搜索', date: '2026-05-12T00:00:00.000Z' }),
        document('new', { title: '搜索', date: '2026-05-13T00:00:00.000Z' }),
      ],
      '搜索',
    );

    assert.deepEqual(
      results.map((result) => result.id),
      ['new', 'a', 'b'],
    );
  });

  it('creates compact excerpts around the first body match', () => {
    const excerpt = createSearchExcerpt(
      '开头是一段背景说明。这里开始写 Cloudflare Pages 的部署体验，后面还有一些细节。',
      'cloudflare',
      '备用摘要',
      32,
    );

    assert.match(excerpt, /Cloudflare Pages/);
    assert.ok(excerpt.startsWith('...'));
    assert.ok(excerpt.length <= 38);
  });
});
