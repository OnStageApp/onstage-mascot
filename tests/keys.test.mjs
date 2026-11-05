// The state key list must equal the generator's (the Figma component set uses the same keys), followed by
// the states added by hand to spec/ after the import, in the order they were added.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGenerator } from '../tools/lib/sources.mjs';
import { readJson, web } from './helpers.mjs';

const HAND_ADDED = ['gift'];

test('spec/states.json keys equal the generator keys, in order, then the hand-added states', () => {
  const G = loadGenerator();
  const gen = G.ST.map(s => s[0]);
  const spec = readJson('spec/states.json').states.map(s => s.key);
  assert.equal(gen.length, 85);
  assert.deepEqual(spec, [...gen, ...HAND_ADDED]);
  assert.equal(new Set(spec).size, spec.length, 'state keys are unique');
});

test('the web package exposes the same keys', async () => {
  const m = await web();
  assert.deepEqual([...m.STATE_KEYS], readJson('spec/states.json').states.map(s => s.key));
});
