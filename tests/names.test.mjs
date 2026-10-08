// mascot.config.json is the one place for names; everything else must agree with it.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readJson } from './helpers.mjs';

test('names agree with mascot.config.json', async () => {
  const cfg = readJson('mascot.config.json');
  assert.equal(readJson('package.json').name, cfg.npmName);
  const react = await import(path.join(ROOT, 'packages/web/dist/react.js'));
  assert.equal(typeof react[cfg.component], 'function', 'component export');
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  for (const v of [cfg.repo, cfg.npmName, cfg.dartPackage, cfg.component]) assert.ok(readme.includes(v), `README mentions ${v}`);
});
