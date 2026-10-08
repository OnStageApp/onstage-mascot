// Every state renders valid SVG, at rest, through its whole motion and in idle, on both surfaces.
import test from 'node:test';
import assert from 'node:assert/strict';
import { web, checkSvg } from './helpers.mjs';

test('every state renders well-formed SVG with finite numbers', async () => {
  const m = await web();
  let n = 0;
  for (const key of m.STATE_KEYS) {
    const st = m.getState(key), clip = m.SPEC.motion[st.motion.id];
    for (const surface of ['light', 'dark']) {
      checkSvg(m.renderFrameSvg(key, {}, { surface })); n++;
      for (let f = 0; f < clip.frames + 12; f += 0.5) { checkSvg(m.renderFrameSvg(key, { phase: 'motion', frame: f }, { surface })); n++; }
      for (const t of [0, 0.7, 1.9, 2.95, 4.2]) { checkSvg(m.renderFrameSvg(key, { phase: 'idle', t, blink: st.actors.map(() => 0.3) }, { surface })); n++; }
    }
  }
  assert.ok(n > 10000);
});

test('dark surface hides the ground shadow', async () => {
  const m = await web();
  const light = m.renderFrameSvg('hello'), dark = m.renderFrameSvg('hello', {}, { surface: 'dark' });
  assert.ok(light.includes('#7FBFD3'));
  assert.ok(!dark.includes('#7FBFD3'));
});

test('unknown state throws', async () => {
  const m = await web();
  assert.throws(() => m.renderFrameSvg('nope'), /Unknown mascot state/);
});
