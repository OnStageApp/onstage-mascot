// The state key list must equal the generator's (the Figma component set uses the same keys).
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGenerator } from '../tools/lib/sources.mjs';
import { readJson, web } from './helpers.mjs';

test('spec/states.json keys equal the generator keys, in order', () => {
  const G = loadGenerator();
  const gen = G.ST.map(s => s[0]);
  const spec = readJson('spec/states.json').states.map(s => s.key);
  assert.equal(gen.length, 85);
  assert.deepEqual(spec, gen);
});

test('the web package exposes the same keys', async () => {
  const m = await web();
  assert.deepEqual([...m.STATE_KEYS], readJson('spec/states.json').states.map(s => s.key));
});
