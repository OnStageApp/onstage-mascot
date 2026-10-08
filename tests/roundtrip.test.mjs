// Interpolating the stored 30 fps frames reproduces the 60 fps rig within the tolerance in
// reports/bake-report.json, using the web package's own sampler.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readJson, web } from './helpers.mjs';
import { bakeAll, measure } from '../tools/bake.mjs';

// Ceilings; the measured values are in reports/bake-report.json. pos in body units, ang in degrees.
export const TOLERANCE = { pos: 1.0, ang: 5, scale: 0.1, presence: 0.05, opacity: 0.07 };

test('30 fps interpolation matches the 60 fps rig', async () => {
  const m = await web();
  const { runs } = bakeAll(readJson('spec/states.json'));
  const report = readJson('reports/bake-report.json');
  for (const [id, frames] of Object.entries(runs)) {
    const clip = m.SPEC.motion[id];
    const e = measure(clip, frames, p => p, m.sampleClip);
    for (const k of Object.keys(TOLERANCE)) {
      assert.ok(e[k] <= TOLERANCE[k], `${id} ${k} ${e[k]} > ${TOLERANCE[k]}`);
      assert.equal(e[k], report.clips[id].interpolationError[k], `${id} ${k}: package sampler disagrees with the bake report`);
    }
  }
});

test('loops are seamless', () => {
  const report = readJson('reports/bake-report.json');
  for (const [id, r] of Object.entries(report.clips)) if (r.loopSeam != null) assert.ok(r.loopSeam < 1e-3, id);
});
