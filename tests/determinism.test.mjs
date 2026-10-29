// The same frame always gives the same SVG; a re-bake gives the same data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { web, readJson } from './helpers.mjs';
import { bakeAll } from '../tools/bake.mjs';
import { importStates } from '../tools/import-generator.mjs';

test('same frame, same SVG', async () => {
  const m = await web();
  for (const key of m.STATE_KEYS) {
    for (const f of [{}, { phase: 'motion', frame: 7.25 }, { phase: 'idle', t: 1.3, blink: [0.5] }]) {
      assert.equal(m.renderFrameSvg(key, f), m.renderFrameSvg(key, { ...f }));
    }
  }
});

test('re-baking reproduces spec/motion exactly', () => {
  const { clips } = bakeAll(readJson('spec/states.json'));
  for (const [id, c] of Object.entries(clips)) assert.deepEqual(JSON.parse(JSON.stringify(c)), readJson(`spec/motion/${id}.json`), id);
});

// Tokens added to palette.json by hand after the import (0.4.0: propInk, for props.json).
const HAND_TOKENS = ['propInk'];

test('re-importing the generator reproduces spec/states.json and palette.json', () => {
  // Fails once spec/ has been hand-edited on purpose; then delete this test or re-run with --import.
  const { states, palette } = importStates();
  assert.deepEqual(JSON.parse(JSON.stringify(states)), readJson('spec/states.json'));
  const spec = readJson('spec/palette.json');
  spec.tokens = spec.tokens.filter(t => !HAND_TOKENS.includes(t));
  for (const s of Object.values(spec.surfaces)) for (const t of HAND_TOKENS) delete s[t];
  const imported = JSON.parse(JSON.stringify(palette));
  delete imported.$comment; delete spec.$comment;
  assert.deepEqual(imported, spec);
});
