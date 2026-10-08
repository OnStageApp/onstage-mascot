// Structural checks on spec/: tokens, motion references, field names, clip shapes.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readJson } from './helpers.mjs';
import { NUM_FIELDS, EYE_TYPES, MOUTH_TYPES } from '../tools/lib/pose.mjs';

const palette = readJson('spec/palette.json'), states = readJson('spec/states.json');
const motion = Object.fromEntries(fs.readdirSync(path.join(ROOT, 'spec/motion')).map(f => [f.slice(0, -5), readJson('spec/motion/' + f)]));

test('palette: both surfaces define every token', () => {
  for (const s of ['light', 'dark']) assert.deepEqual(Object.keys(palette.surfaces[s]).sort(), [...palette.tokens].sort());
  assert.equal(palette.surfaces.dark.shadow, null);
});

test('states: tokens, actors, poses and motion references are valid', () => {
  const tokens = new Set(palette.tokens);
  const walk = (l, st) => {
    if (l.type === 'actor') { assert.ok(st.actors[l.actor], st.key); return; }
    if (l.type === 'group') return l.children.forEach(c => walk(c, st));
    for (const k of ['fill', 'stroke']) if (l[k] != null) assert.ok(tokens.has(l[k]), `${st.key}: ${l[k]}`);
    if (l.type === 'path') assert.match(l.d, /^M[-\d. MLCZ]*$/, `${st.key}: path data must be M L C Z only`);
  };
  for (const st of states.states) {
    st.layers.forEach(l => walk(l, st));
    for (const a of st.actors) {
      for (const f of [...NUM_FIELDS, 'fold', 'badge']) assert.equal(typeof a.rest[f], 'number', `${st.key}.${f}`);
      assert.ok(EYE_TYPES.includes(a.rest.eyeL) && EYE_TYPES.includes(a.rest.eyeR) && MOUTH_TYPES.includes(a.rest.mouth));
    }
    assert.ok(motion[st.motion.id], `${st.key}: motion ${st.motion.id}`);
    assert.ok(['once', 'loop'].includes(st.motion.plays));
    assert.equal(motion[st.motion.id].loop, st.motion.plays === 'loop', st.key);
  }
  assert.ok(motion[states.idle.motion] && motion[states.blink.motion]);
});

test('clips: rows match headers, discrete indices are in range', () => {
  for (const [id, c] of Object.entries(motion)) {
    assert.equal(c.rows.length, c.frames, id);
    for (const r of c.rows) assert.equal(r.length, c.fields.length, id);
    for (const [k, tab] of [['eyeL', c.eyeTypes], ['eyeR', c.eyeTypes], ['mouth', c.mouthTypes]]) {
      if (!c.fields.includes(k) && !(k in c.constants)) continue;
      const col = c.fields.indexOf(k), colP = c.fields.indexOf(k + 'Prev');
      for (const r of c.rows) {
        const v = col >= 0 ? r[col] : c.constants[k], p = colP >= 0 ? r[colP] : c.constants[k + 'Prev'];
        assert.ok(v >= 0 && v < tab.length && p >= -1 && p < tab.length, id);
      }
    }
    if (c.kind === 'absolute' && !c.loop) assert.ok(c.frames >= 2);
  }
});

test('once clips start and end at the rest pose of their state', async () => {
  const { sampleClip } = await import('../packages/web/dist/index.js');
  for (const st of states.states) {
    const c = motion[st.motion.id];
    if (c.kind !== 'absolute' || c.loop) continue;
    const rest = st.actors[0].rest;
    for (const t of [0, c.duration]) {
      const s = sampleClip(c, t);
      for (const f of NUM_FIELDS) {
        if (/^a[LR](x|y|ang|len|thumb)$/.test(f) && !rest['a' + f[1]]) continue;
        const d = f === 'tilt' ? Math.abs(((s[f] - rest[f]) % 360 + 540) % 360 - 180) : Math.abs(s[f] - rest[f]);
        assert.ok(d < 2e-3, `${st.key} t=${t} ${f}: ${s[f]} vs ${rest[f]}`);
      }
      for (const k of ['eyeL', 'eyeR', 'mouth']) { assert.equal(s[k], rest[k], `${st.key} ${k}`); assert.equal(s[k + 'Fade'], 1); }
    }
  }
});
