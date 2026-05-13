import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  featuredProjects,
  isPublished,
  newestFirst,
  notesByPinnedThenNewest,
} from '../src/utils/collections.ts';

const entry = (id, data) => ({ id, data });

describe('collection helpers', () => {
  it('filters draft entries from public collections', () => {
    assert.equal(isPublished(entry('public', { draft: false, date: new Date('2026-05-12') })), true);
    assert.equal(isPublished(entry('draft', { draft: true, date: new Date('2026-05-12') })), false);
  });

  it('sorts dated entries newest first and then by id', () => {
    const sorted = newestFirst([
      entry('b', { date: new Date('2026-05-10') }),
      entry('c', { date: new Date('2026-05-12') }),
      entry('a', { date: new Date('2026-05-12') }),
    ]);

    assert.deepEqual(sorted.map((item) => item.id), ['a', 'c', 'b']);
  });

  it('sorts notes with pinned entries first before date and id', () => {
    const sorted = notesByPinnedThenNewest([
      entry('old-pinned', { pinned: true, date: new Date('2026-05-10') }),
      entry('new-unpinned', { pinned: false, date: new Date('2026-05-13') }),
      entry('new-pinned-b', { pinned: true, date: new Date('2026-05-12') }),
      entry('new-pinned-a', { pinned: true, date: new Date('2026-05-12') }),
    ]);

    assert.deepEqual(sorted.map((item) => item.id), [
      'new-pinned-a',
      'new-pinned-b',
      'old-pinned',
      'new-unpinned',
    ]);
  });

  it('keeps featured projects public and newest first', () => {
    const sorted = featuredProjects([
      entry('draft-featured', { featured: true, draft: true, date: new Date('2026-05-13') }),
      entry('older-featured', { featured: true, draft: false, date: new Date('2026-05-10') }),
      entry('newer-featured', { featured: true, draft: false, date: new Date('2026-05-12') }),
      entry('plain', { featured: false, draft: false, date: new Date('2026-05-13') }),
    ]);

    assert.deepEqual(sorted.map((item) => item.id), ['newer-featured', 'older-featured']);
  });
});
