// The built package: imports cleanly as ESM, the player runs headless, the React component renders on
// the server, and a Next-style consumer type-checks against the .d.ts files.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ROOT, web, checkSvg } from './helpers.mjs';

test('mulberry32 check values (docs/renderer-contract.md section 10)', async () => {
  const m = await web(); const r = m.mulberry32(7);
  assert.deepEqual([r(), r(), r()], [0.011704753153026104, 0.06195825757458806, 0.97690763277933]);
});

test('ESM entry points import cleanly', async () => {
  const m = await web();
  for (const k of ['renderFrameSvg', 'createPlayer', 'mulberry32', 'STATE_KEYS', 'SPEC']) assert.ok(m[k], k);
  const r = await import(pathToFileURL(path.join(ROOT, 'packages/web/dist/react.js')).href);
  assert.equal(typeof r.Buddy, 'function');
});

test('the package resolves by name through its exports map', () => {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e',
    "const m = await import('@onstage/mascot'); const r = await import('@onstage/mascot/react'); console.log(typeof m.renderFrameSvg, typeof r.Buddy)"], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(r.stdout.trim(), 'function function', r.stderr);
});

test('player: once motion, then idle with seeded blinks; onDone fires once', async () => {
  const m = await web();
  const frames = []; let done = 0;
  const p = m.createPlayer({ state: 'hello', autoStart: false, onFrame: s => frames.push(s), onDone: () => done++, random: m.mulberry32(7) });
  assert.equal(p.phase, 'motion');
  assert.equal(frames[0], m.renderFrameSvg('hello'), 'frame 0 is the resting pose (what SSR shows)');
  const dur = m.SPEC.motion.hello.duration;
  for (let t = 0; t < dur + 0.05; t += 1 / 60) p.advance(1 / 60);
  assert.equal(p.phase, 'idle'); assert.equal(done, 1);
  for (let i = 0; i < 60 * 12; i++) p.advance(1 / 60);
  frames.forEach(checkSvg);
  // Same seed, same frames.
  const again = []; const q = m.createPlayer({ state: 'hello', autoStart: false, onFrame: s => again.push(s), random: m.mulberry32(7) });
  for (let t = 0; t < dur + 0.05; t += 1 / 60) q.advance(1 / 60);
  for (let i = 0; i < 60 * 12; i++) q.advance(1 / 60);
  assert.deepEqual(again, frames);
  p.destroy(); q.destroy();
});

test('player: idle blinks on its own schedule', async () => {
  const m = await web();
  const frames = [];
  const p = m.createPlayer({ state: 'idle', autoStart: false, playOnMount: false, onFrame: s => frames.push(s), random: m.mulberry32(1) });
  assert.equal(p.phase, 'idle');
  for (let i = 0; i < 60 * 15; i++) p.advance(1 / 60);
  const eyeRy = f => Math.min(...[...f.matchAll(/rx="5\.2" ry="([\d.]+)"/g)].map(x => +x[1]));
  const closed = frames.filter(f => eyeRy(f) < 4).length;
  assert.ok(closed >= 2, 'at least one blink in 15 s');
  assert.ok(closed < frames.length / 5, 'eyes are mostly open');
});

test('player: reduced motion shows the resting pose only and still reports done', async () => {
  const m = await web();
  let done = 0; const frames = [];
  const p = m.createPlayer({ state: 'all-set', autoStart: false, reducedMotion: true, onFrame: s => frames.push(s), onDone: () => done++ });
  for (let i = 0; i < 300; i++) p.advance(1 / 60);
  await new Promise(r => setTimeout(r, 0));
  assert.equal(p.phase, 'rest'); assert.equal(frames.length, 1); assert.equal(frames[0], m.renderFrameSvg('all-set')); assert.equal(done, 1);
});

test('player: loop states keep looping', async () => {
  const m = await web();
  const p = m.createPlayer({ state: 'loading', autoStart: false });
  for (let i = 0; i < 60 * 10; i++) p.advance(1 / 60);
  assert.equal(p.phase, 'motion');
});

test('React component renders the resting SVG on the server', async () => {
  const React = await import('react');
  const { renderToString } = await import('react-dom/server');
  const { Buddy } = await import(pathToFileURL(path.join(ROOT, 'packages/web/dist/react.js')).href);
  const m = await web();
  const html = renderToString(React.createElement(Buddy, { state: 'no-events', size: 120 }));
  assert.match(html, /^<span role="img" aria-label="No events yet"/);
  assert.ok(html.includes(m.renderFrameSvg('no-events', {}, { size: 120 })));
});

test('a Next 16 style consumer type-checks', () => {
  const tsc = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
  const r = spawnSync(process.execPath, [tsc, '-p', path.join(ROOT, 'tests/consumer/tsconfig.json')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
