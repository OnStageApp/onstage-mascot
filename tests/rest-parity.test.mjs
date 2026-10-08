// Rest-pose parity: all 85 resting frames from the web renderer, rasterised by rsvg-convert at 240 px
// on the card colour, against the PNGs the generator produced (tests/fixtures/rest-reference, copied
// from claude-brain/design-work/mascot/blue-app-states/png). Writes reports/rest-parity/.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { ROOT, web } from './helpers.mjs';
import { RSVG } from '../tools/lib/web.mjs';

test('resting frames match the generator PNGs', async () => {
  const m = await web();
  const out = path.join(ROOT, 'out', 'rest-parity'), ref = path.join(ROOT, 'tests', 'fixtures', 'rest-reference');
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  m.STATE_KEYS.forEach((k, i) => {
    const svg = m.renderFrameSvg(k, {}, { size: 240, background: 'card' });
    execFileSync(RSVG, ['-w', '240', '-h', '240', '-o', path.join(out, `${String(i + 1).padStart(2, '0')}-${k}.png`)], { input: svg });
  });
  const report = path.join(ROOT, 'reports', 'rest-parity');
  const r = spawnSync('python3', [path.join(ROOT, 'tests/parity/compare.py'), '--a', ref, '--b', out, '--report', report,
    '--tol-max', '16', '--tol-mean', '0.05', '--tol-pixels', '0', '--pixel-threshold', '16'], { encoding: 'utf8' });
  const summary = JSON.parse(r.stdout.trim().split('\n').pop());
  assert.equal(summary.files, 85);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  console.log('rest parity', JSON.stringify(summary));
});
