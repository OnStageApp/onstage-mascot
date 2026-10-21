// The extra additive clips (hop, glance-left, glance-right, look-around), the ground shadow factor and
// player.playClip / ambient. Sizes are checked at a 220 px render of a lone Buddy (s 2.2).
import test from 'node:test';
import assert from 'node:assert/strict';
import { web, readJson, checkSvg } from './helpers.mjs';

const EXTRA = ['hop', 'glance-left', 'glance-right', 'look-around'];
const PX = 220 / 240 * 2.2; // px per body unit at a 220 px render

const shadowOf = svg => {
  const m = /<ellipse cx="([\d.-]+)" cy="([\d.-]+)" rx="([\d.-]+)" ry="([\d.-]+)"/.exec(svg);
  return m && { cx: +m[1], cy: +m[2], rx: +m[3], ry: +m[4] };
};
const eyeX = svg => +/<ellipse cx="([\d.-]+)" cy="[\d.-]+" rx="5\.(?:2|82)"/.exec(svg)[1];

test('extra clips: additive one-shots that start and end at no offset', async () => {
  const m = await web();
  for (const id of EXTRA) {
    const c = readJson(`spec/motion/${id}.json`);
    assert.equal(c.kind, 'additive', id); assert.equal(c.loop, false, id);
    assert.deepEqual(m.SPEC.motion[id], c, `${id}: web data is stale`);
    for (const t of [0, c.duration]) {
      const s = m.sampleClip(c, t);
      for (const f of c.fields) assert.ok(Math.abs(s[f] - (['sx', 'sy', 'blink', 'shadow'].includes(f) ? 1 : 0)) < 2e-3, `${id} t=${t} ${f}=${s[f]}`);
    }
  }
  assert.deepEqual(m.overlayClipIds().filter(id => EXTRA.includes(id)).sort(), [...EXTRA].sort());
  assert.ok(!m.overlayClipIds().includes('blink') && !m.overlayClipIds().includes('idle'));
});

test('hop: about 12 px up at 220 px, squash and stretch, shadow stays on the ground and shrinks', async () => {
  const m = await web();
  const c = m.SPEC.motion.hop;
  let top = 0, tTop = 0, syMin = 1, syMax = 1;
  for (let t = 0; t <= c.duration; t += 1 / 60) {
    const s = m.sampleClip(c, t);
    if (-s.y > top) { top = -s.y; tTop = t; }
    syMin = Math.min(syMin, s.sy); syMax = Math.max(syMax, s.sy);
  }
  assert.ok(top * PX >= 11 && top * PX <= 14, `hop height ${top * PX} px`);
  assert.ok(tTop > 0.2 && tTop < 0.36, `top at ${tTop} s`);
  assert.ok(syMin < 0.93 && syMax > 1.05, `squash ${syMin}, stretch ${syMax}`);
  const rest = shadowOf(m.renderFrameSvg('excited', { phase: 'idle', t: 0 }, { size: 220 }));
  const up = shadowOf(m.renderFrameSvg('excited', { phase: 'idle', t: 0, overlay: { clip: 'hop', t: tTop } }, { size: 220 }));
  assert.equal(up.cy, rest.cy, 'the shadow stays on the ground');
  assert.ok(up.rx / rest.rx < 0.8 && up.rx / rest.rx > 0.65, `shadow width at the top ${up.rx / rest.rx}`);
  assert.ok(up.ry < rest.ry, 'the shadow is also thinner at the top');
});

test('glances: the eyes move about 8 px at 220 px, to the named side, with the head tilting the same way', async () => {
  const m = await web();
  const base = eyeX(m.renderFrameSvg('excited', { phase: 'rest' }));
  for (const [id, dir] of [['glance-left', -1], ['glance-right', 1]]) {
    const svg = m.renderFrameSvg('excited', { phase: 'rest', overlay: { clip: id, t: 0.6 } });
    checkSvg(svg);
    const dx = eyeX(svg) - base; // body units: the eyes are drawn inside the actor's scaled group
    assert.ok(dir * dx >= 3.8 && dir * dx <= 4.2, `${id}: eyes moved ${dx} body units`);
    assert.ok(dir * dx * PX >= 7.5, `${id}: ${dir * dx * PX} px`);
    const s = m.sampleClip(m.SPEC.motion[id], 0.6);
    assert.ok(dir * s.tilt > 1, `${id}: tilt ${s.tilt}`);
  }
  const c = m.SPEC.motion['look-around'];
  let lo = 0, hi = 0, blink = 1;
  for (let t = 0; t <= c.duration; t += 1 / 60) { const s = m.sampleClip(c, t); lo = Math.min(lo, s.edx); hi = Math.max(hi, s.edx); blink = Math.min(blink, s.blink); }
  assert.ok(lo <= -3.8 && hi >= 3.8 && blink < 0.5, `look-around ${lo} ${hi} blink ${blink}`);
});

test('rest poses carry no shadow factor, so static output is unchanged', () => {
  for (const st of readJson('spec/states.json').states) for (const a of st.actors) assert.ok(!('shadow' in a.rest), st.key);
});

test('playClip plays on top of idle, reports done once, and leaves the blink schedule alone', async () => {
  const m = await web();
  const run = withClip => {
    const frames = []; let done = 0;
    const p = m.createPlayer({ state: 'excited', autoStart: false, playOnMount: false, onFrame: s => frames.push(s), random: m.mulberry32(5) });
    for (let i = 0; i < 30; i++) p.advance(1 / 60);
    if (withClip) { p.playClip('hop', { onDone: () => done++ }); assert.equal(p.clip, 'hop'); }
    for (let i = 0; i < 60 * 8; i++) p.advance(1 / 60);
    return { p, frames, done: () => done };
  };
  const a = run(true), b = run(false);
  assert.equal(a.p.clip, null); assert.equal(a.p.phase, 'idle'); assert.equal(a.done(), 1);
  a.frames.forEach(checkSvg);
  assert.notDeepEqual(a.frames.slice(30, 60), b.frames.slice(30, 60), 'the hop shows');
  assert.deepEqual(a.frames.slice(-300), b.frames.slice(-300), 'after the hop, the same idle and blinks');
  a.p.destroy(); b.p.destroy();
});

test('playClip: a new clip replaces the one playing; unknown, absolute and loop clips are refused', async () => {
  const m = await web();
  const p = m.createPlayer({ state: 'excited', autoStart: false, playOnMount: false });
  let first = 0, second = 0;
  p.playClip('glance-left', { onDone: () => first++ });
  for (let i = 0; i < 10; i++) p.advance(1 / 60);
  p.playClip('glance-right', { onDone: () => second++ });
  for (let i = 0; i < 120; i++) p.advance(1 / 60);
  assert.equal(first, 0); assert.equal(second, 1);
  for (const id of ['nope', 'hello', 'idle']) assert.throws(() => p.playClip(id), id);
  p.destroy();
});

test('playClip under reduced motion draws nothing new and still reports done', async () => {
  const m = await web();
  const frames = []; let done = 0;
  const p = m.createPlayer({ state: 'excited', autoStart: false, reducedMotion: true, onFrame: s => frames.push(s) });
  p.playClip('hop', { onDone: () => done++ });
  for (let i = 0; i < 60; i++) p.advance(1 / 60);
  await new Promise(r => setTimeout(r, 0));
  assert.equal(frames.length, 1); assert.equal(p.clip, null); assert.equal(done, 1);
  p.destroy();
});

test('ambient: plays the listed clips now and then while idling; never under reduced motion', async () => {
  const m = await web();
  const seen = new Set();
  const p = m.createPlayer({ state: 'excited', autoStart: false, playOnMount: false, ambient: { clips: ['hop', 'glance-left', 'glance-right'], gapMin: 1, gapMax: 2, random: m.mulberry32(3) } });
  for (let i = 0; i < 60 * 60; i++) { p.advance(1 / 60); if (p.clip) seen.add(p.clip); }
  assert.deepEqual([...seen].sort(), ['glance-left', 'glance-right', 'hop']);
  p.setAmbient(null);
  for (let i = 0; i < 60 * 3; i++) p.advance(1 / 60);
  assert.equal(p.clip, null);
  p.destroy();

  const q = m.createPlayer({ state: 'excited', autoStart: false, playOnMount: false, reducedMotion: true, ambient: { clips: ['hop'], gapMin: 0.1, gapMax: 0.1 } });
  for (let i = 0; i < 60 * 3; i++) { q.advance(1 / 60); assert.equal(q.clip, null); }
  q.destroy();
});
