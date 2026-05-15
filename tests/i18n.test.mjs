import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  contentSlug,
  entriesForLanguage,
  getLanguageFromPathname,
  localizedPath,
} from '../src/utils/i18n.ts';

const entry = (id, data) => ({ id, data });

describe('i18n helpers', () => {
  it('detects root Chinese paths and /en/ English paths', () => {
    assert.equal(getLanguageFromPathname('/'), 'zh');
    assert.equal(getLanguageFromPathname('/notes/git/'), 'zh');
    assert.equal(getLanguageFromPathname('/en/'), 'en');
    assert.equal(getLanguageFromPathname('/en/notes/git/'), 'en');
  });

  it('maps current paths between Chinese root routes and English /en/ routes', () => {
    assert.equal(localizedPath('/', 'en'), '/en/');
    assert.equal(localizedPath('/notes/git/', 'en'), '/en/notes/git/');
    assert.equal(localizedPath('/en/notes/git/', 'zh'), '/notes/git/');
    assert.equal(localizedPath('/en/', 'zh'), '/');
  });

  it('uses translationKey before filename suffixes for public content slugs', () => {
    assert.equal(contentSlug(entry('git-guide-en', { translationKey: 'git-guide' })), 'git-guide');
    assert.equal(contentSlug(entry('docker-guide-en', {})), 'docker-guide');
    assert.equal(contentSlug(entry('personal-site', {})), 'personal-site');
  });

  it('filters entries to the requested language', () => {
    const entries = [
      entry('zh-note', { lang: 'zh' }),
      entry('en-note', { lang: 'en' }),
      entry('implicit-zh', {}),
    ];

    assert.deepEqual(entriesForLanguage(entries, 'zh').map((item) => item.id), ['zh-note', 'implicit-zh']);
    assert.deepEqual(entriesForLanguage(entries, 'en').map((item) => item.id), ['en-note']);
  });
});
