import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('GitHub Actions CI workflow', () => {
  it('exposes the collection test command through package scripts', async () => {
    const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

    assert.equal(
      packageJson.scripts['test:collections'],
      'node --experimental-strip-types --test tests/collections.test.mjs',
    );
  });

  it('runs collection tests, Astro check, and Astro build on pull requests and main pushes', async () => {
    const workflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

    assert.match(workflow, /pull_request:\s*\n\s+branches:\s+\[main\]/);
    assert.match(workflow, /push:\s*\n\s+branches:\s+\[main\]/);
    assert.match(workflow, /node-version:\s+22/);
    assert.match(workflow, /npm ci/);
    assert.match(workflow, /npm run test:collections/);
    assert.match(workflow, /npm run check/);
    assert.match(workflow, /npm run build/);
  });
});
