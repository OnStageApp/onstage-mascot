// The files `npm run export-static` writes (assets/) are checked in, so they must match the static
// entry: SVG and index.json byte for byte, PNG by size and transparency. Fails with the fix to run.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, web } from './helpers.mjs';
import { buildTextAssets, ASSETS, PNG_SIZE } from '../tools/export-static.mjs';

const FIX = 'run `npm run build && npm run export-static`';

test('assets/: SVG files and index.json equal the static entry output', async () => {
  const text = await buildTextAssets();
  const keys = Object.keys(text);
  assert.equal(keys.length, 85 * 2 + 1);
  for (const rel of keys) {
    const file = path.join(ASSETS, rel);
    assert.ok(fs.existsSync(file), `${rel} is missing: ${FIX}`);
    assert.equal(fs.readFileSync(file, 'utf8'), text[rel], `${rel} is out of date: ${FIX}`);
  }
  // No stray files: everything on disk is either generated text or a PNG named in the index.
  const index = JSON.parse(text['index.json']);
  const expected = new Set([...keys, ...index.states.flatMap(s => [s.png, s.png1x])]);
  const onDisk = [];
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else onDisk.push(path.relative(ASSETS, p)); } })(ASSETS);
  assert.deepEqual(onDisk.sort(), [...expected].sort(), `unexpected or missing files in assets/: ${FIX}`);
});

test('assets/: every state has a PNG at 480 and 240 px with a transparent background', async () => {
  const m = await web();
  const index = JSON.parse(fs.readFileSync(path.join(ASSETS, 'index.json'), 'utf8'));
  assert.deepEqual(index.states.map(s => s.key), [...m.STATE_KEYS]);
  for (const s of index.states) {
    for (const [rel, px] of [[s.png, PNG_SIZE], [s.png1x, PNG_SIZE / 2]]) {
      const b = fs.readFileSync(path.join(ASSETS, rel));
      assert.equal(b.subarray(1, 4).toString(), 'PNG', rel);
      assert.equal(b.readUInt32BE(16), px, `${rel} width`);
      assert.equal(b.readUInt32BE(20), px, `${rel} height`);
      assert.equal(b[25], 6, `${rel} has an alpha channel (colour type 6)`);
    }
  }
});
