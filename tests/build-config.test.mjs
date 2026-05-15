import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('build configuration', () => {
  it('calibrates the Vite chunk warning limit for the bundled Keystatic admin route', async () => {
    const config = await readFile(new URL('../astro.config.mjs', import.meta.url), 'utf8');

    assert.match(config, /Keystatic admin/);
    assert.match(config, /chunkSizeWarningLimit:\s*3200/);
  });
});
