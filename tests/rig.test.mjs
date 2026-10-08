// The extended rig (tools/lib/rig.mjs) behaves exactly like the engine's makeRig on the engine's channels.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../tools/lib/sources.mjs';
import { makeRig } from '../tools/lib/rig.mjs';
import { fromEngine, neutralPose } from '../tools/lib/pose.mjs';

test('extended rig equals the engine rig on the showreel', () => {
  const E = loadEngine(), a = E.makeRig(), b = makeRig(), dt = 1 / 60;
  const n = Math.round(E.reelDur * 60);
  for (let i = 0; i < n; i++) {
    const p = E.reelPose(i * dt);
    if (p.pie || p.carX != null) continue;
    const o = a.step({ ...p }, dt), q = b.step(fromEngine(p, neutralPose()), dt);
    for (const k of ['sx', 'sy', 'edx', 'edy', 'mdx', 'footL', 'footR', 'blink', 'tilt']) assert.ok(Math.abs(o[k] - q[k]) < 1e-9, `${i} ${k}`);
    for (const k of ['x', 'y']) assert.ok(Math.abs(o[k] / 3 - q[k]) < 1e-9, `${i} ${k}`);
    for (const s of ['L', 'R']) {
      assert.ok(Math.abs(o['arm' + s + 'a'] - q['a' + s]) < 1e-9, `${i} presence ${s}`);
      if (o['arm' + s] != null) { assert.ok(q['a' + s] > 0.02); assert.ok(Math.abs(o['arm' + s] - q['a' + s + 'ang']) < 1e-9, `${i} arm ${s}`); }
      else assert.ok(!(q['a' + s] > 0.02));
    }
    assert.deepEqual([o.eyes[0], o.eyes[1], o.mouth], [q.eyeL, q.eyeR, q.mouth]);
    assert.ok(Math.abs(o.eyeFade[0] - q.eyeLFade) < 1e-12 && Math.abs(o.mouthFade - q.mouthFade) < 1e-12);
  }
});
