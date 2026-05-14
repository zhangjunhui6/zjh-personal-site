import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  collectTagSummaries,
  filterItemsByTag,
  groupItemsByYear,
  tagHref,
} from '../src/utils/taxonomy.ts';

const item = (id, date, tags, overrides = {}) => ({
  id,
  collection: 'notes',
  title: id,
  description: `${id} description`,
  date: new Date(date),
  tags,
  href: `/notes/${id}/`,
  label: '记录',
  ...overrides,
});

describe('taxonomy helpers', () => {
  it('builds stable percent-encoded tag URLs', () => {
    assert.equal(tagHref('个人网站'), '/tags/%E4%B8%AA%E4%BA%BA%E7%BD%91%E7%AB%99/');
    assert.equal(tagHref(' writing space '), '/tags/writing%20space/');
  });

  it('collects trimmed tag summaries and ignores blank tags', () => {
    const summaries = collectTagSummaries([
      item('first', '2026-05-13', ['Writing', 'Personal Site', 'Writing', ' ']),
      item('second', '2026-05-12', ['Writing', 'Life']),
      item('third', '2026-05-11', [' Personal Site ']),
    ]);

    assert.deepEqual(summaries, [
      { tag: 'Personal Site', count: 2, href: '/tags/Personal%20Site/' },
      { tag: 'Writing', count: 2, href: '/tags/Writing/' },
      { tag: 'Life', count: 1, href: '/tags/Life/' },
    ]);
  });

  it('filters entries by normalized tag and returns newest entries first', () => {
    const filtered = filterItemsByTag(
      [
        item('old', '2026-05-10', ['写作']),
        item('new', '2026-05-13', [' 写作 ']),
        item('other', '2026-05-12', ['生活']),
      ],
      '写作',
    );

    assert.deepEqual(
      filtered.map((entry) => entry.id),
      ['new', 'old'],
    );
  });

  it('groups entries by descending year with newest entries inside each year', () => {
    const groups = groupItemsByYear([
      item('older-2025', '2025-09-01', ['Archive']),
      item('older-2026', '2026-01-01', ['Archive']),
      item('newer-2026', '2026-05-13', ['Archive']),
    ]);

    assert.deepEqual(
      groups.map((group) => ({
        year: group.year,
        ids: group.entries.map((entry) => entry.id),
      })),
      [
        { year: '2026', ids: ['newer-2026', 'older-2026'] },
        { year: '2025', ids: ['older-2025'] },
      ],
    );
  });
});
