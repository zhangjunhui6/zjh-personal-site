import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const contentRoot = new URL('../src/content/', import.meta.url);

describe('bilingual content pairs', () => {
  it('keeps every published content entry paired by translationKey', async () => {
    const entries = await contentEntries();
    const published = entries.filter((entry) => entry.draft !== true);
    const groups = new Map();

    for (const entry of published) {
      assert.ok(entry.translationKey, `${entry.file} needs a translationKey`);
      const key = `${entry.collection}:${entry.translationKey}`;
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    }

    for (const [key, group] of groups) {
      const languages = new Set(group.map((entry) => entry.lang ?? 'zh'));
      assert.ok(languages.has('zh'), `${key} is missing a Chinese entry`);
      assert.ok(languages.has('en'), `${key} is missing an English entry`);
    }
  });
});

async function contentEntries() {
  const files = await markdownFiles(contentRoot);

  return Promise.all(
    files.map(async (fileUrl) => {
      const source = await readFile(fileUrl, 'utf8');
      const frontmatter = parseFrontmatter(source);
      const path = fileUrl.pathname;
      const collection = path.includes('/notes/')
        ? 'notes'
        : path.includes('/journal/')
          ? 'journal'
          : 'projects';

      return {
        collection,
        file: path,
        lang: frontmatter.lang,
        draft: frontmatter.draft === 'true',
        translationKey: frontmatter.translationKey,
      };
    }),
  );
}

async function markdownFiles(directoryUrl) {
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const url = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directoryUrl);
      if (entry.isDirectory()) return markdownFiles(url);
      return entry.name.endsWith('.md') || entry.name.endsWith('.mdx') ? [url] : [];
    }),
  );

  return files.flat();
}

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match, 'content entry is missing frontmatter');

  const data = {};
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    data[key] = value;
  }

  return data;
}
