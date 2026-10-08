// npm run bake [-- --import]
// 1. With --import (or when spec/states.json is missing): rebuild spec/palette.json and spec/states.json
//    from the copied generator. This overwrites hand edits to those two files.
// 2. Bake every motion in tools/motion/definitions.mjs through the rig at 60 fps and write 30 fps
//    frames to spec/motion/<id>.json. Measures how well linear interpolation of the 30 fps frames
//    reproduces the 60 fps rig and writes reports/bake-report.json.
// 3. Regenerate the web package's data module (tools/gen-web-data.mjs).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { importStates } from './import-generator.mjs';
import { MOTIONS } from './motion/definitions.mjs';
import { makeRig } from './lib/rig.mjs';
import { NUM_FIELDS, neutralPose } from './lib/pose.mjs';
import { sample } from './lib/sample.mjs';
import { stringify } from './lib/json.mjs';
import { genWebData } from './gen-web-data.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = path.join(ROOT, 'spec');
const DT = 1 / 60;
const r3 = v => Math.round(v * 1000) / 1000;
const DISC = ['eyeL', 'eyeR', 'mouth'];
const ABS_FIELDS = [...NUM_FIELDS, ...DISC.flatMap(d => [d, d + 'Prev', d + 'Fade'])];
export const ADD_FIELDS = ['x', 'y', 'tilt', 'edx', 'edy', 'mdx', 'mdy', 'footL', 'footR', 'footLRot', 'footRRot', 'aLang', 'aRang'];
export const MUL_FIELDS = ['sx', 'sy', 'blink'];
const ARM_GEOM = s => ['x', 'y', 'ang', 'len', 'thumb'].map(f => 'a' + s + f);

// ---------- rig runs ----------
const asFrame = p => ({ ...p, eyeLPrev: null, eyeLFade: 1, eyeRPrev: null, eyeRFade: 1, mouthPrev: null, mouthFade: 1 });

function maxDiff(a, b, { ignoreArmsOf } = {}) {
  let m = 0;
  for (const f of NUM_FIELDS) {
    if (ignoreArmsOf) { const s = f[1]; if ((s === 'L' || s === 'R') && f.length > 2 && ARM_GEOM(s).includes(f) && ignoreArmsOf[s]) continue; }
    let d = Math.abs(a[f] - b[f]);
    if (f === 'tilt') d = Math.abs(((a[f] - b[f]) % 360 + 540) % 360 - 180);
    m = Math.max(m, d);
  }
  return m;
}
function settled(out, rest) {
  for (const d of DISC) if (out[d] !== rest[d] || out[d + 'Fade'] < 1) return false;
  return maxDiff(out, rest, { ignoreArmsOf: { L: !rest.aL, R: !rest.aR } }) < 1e-3;
}
// An arm that appears snaps its geometry (angle, anchor, length) on the frame it appears, while its
// presence is still near zero. Give the invisible frames before it the same geometry, so that
// interpolating between a 30 fps sample before the snap and one after never swings a tiny arm
// through stale angles. Invisible frames have no effect on the 60 fps picture.
function fillArmGeometry(frames) {
  for (const s of ['L', 'R']) {
    const a = 'a' + s, geom = ARM_GEOM(s);
    for (let i = 1; i < frames.length; i++) {
      if (frames[i - 1][a] < 0.05 && frames[i][a] > frames[i - 1][a]) {
        for (let j = i - 1; j >= 0 && frames[j][a] < 0.05; j--) for (const g of geom) frames[j][g] = frames[i][g];
      }
    }
  }
}
function unwrapTilt(frames, endTilt) {
  for (let i = 1; i < frames.length; i++) {
    while (frames[i].tilt - frames[i - 1].tilt > 180) frames[i].tilt -= 360;
    while (frames[i].tilt - frames[i - 1].tilt < -180) frames[i].tilt += 360;
  }
  if (endTilt != null) {
    const k = Math.round((frames[frames.length - 1].tilt - endTilt) / 360) * 360;
    if (k) for (const f of frames) f.tilt -= k;
  }
}

// A one-shot clip: rig snapped to `base`, follows target(t) for dur seconds, then settles back to base.
function runOnce(def, base, targetAt) {
  const rig = makeRig(), frames = [rig.step(base, DT)];
  for (let i = 1; ; i++) {
    const t = i * DT, out = rig.step(t < def.dur ? targetAt(t) : base, DT);
    frames.push(out);
    if (t >= def.dur + 0.2 && frames.length % 2 === 1 && settled(out, base)) break;
    if (i > 60 * 30) throw new Error(def.source + ': did not settle');
  }
  const residual = maxDiff(frames[frames.length - 1], base, { ignoreArmsOf: { L: !base.aL, R: !base.aR } });
  unwrapTilt(frames, base.tilt);
  frames[frames.length - 1] = asFrame(base);
  if ('aL' in base) fillArmGeometry(frames);
  return { frames, residual, introN: 0 };
}

// A loop: intro = the first period from `base`, loop = the second period (the rig has reached its
// periodic steady state by then). With intro false, the loop is taken after a warm-up and rotated
// so it starts where the offsets are smallest (used by idle, which has no intro).
function runLoop(def, base, targetAt, { intro }) {
  const n = Math.round(def.period * 60), warm = intro ? 1 : 3, rig = makeRig(), all = [rig.step(base, DT)];
  for (let i = 1; i <= (warm + 1) * n; i++) all.push(rig.step(targetAt(i * DT), DT));
  unwrapTilt(all);
  if ('aL' in base) fillArmGeometry(all);
  const seam = maxDiff(all[(warm + 1) * n], all[warm * n]);
  if (intro) return { frames: all.slice(0, 2 * n), seam, introN: n };
  let loop = all.slice(warm * n, (warm + 1) * n);
  let best = 0, bestV = Infinity;
  for (let j = 0; j < n; j += 2) {
    const p = loop[j], v = (p.x || 0) ** 2 + (p.tilt || 0) ** 2 / 100 + ((p.sx - 1) * 30) ** 2 + ((p.sy - 1) * 30) ** 2 + (p.edx || 0) ** 2;
    if (v < bestV) { bestV = v; best = j; }
  }
  loop = loop.slice(best).concat(loop.slice(0, best));
  return { frames: loop, seam, introN: 0 };
}

// ---------- encoding ----------
function encode(id, def, run, fields) {
  const samples = run.frames.filter((_, i) => i % 2 === 0);
  const eyeTypes = [], mouthTypes = [];
  const idx = (tab, v) => { if (v == null) return -1; let i = tab.indexOf(v); if (i < 0) { tab.push(v); i = tab.length - 1; } return i; };
  const rows = samples.map(p => fields.map(f => {
    const m = /^(eyeL|eyeR|mouth)(Prev)?$/.exec(f);
    if (m) return idx(m[1] === 'mouth' ? mouthTypes : eyeTypes, p[f]);
    return r3(p[f]);
  }));
  const constants = {}, keep = [];
  fields.forEach((f, i) => { if (rows.every(r => r[i] === rows[0][i])) constants[f] = rows[0][i]; else keep.push(i); });
  const clip = {
    format: 1, id, kind: def.kind, source: def.source, fps: 30,
    frames: samples.length, loop: !!def.loop, introFrames: run.introN / 2,
    duration: r3(def.loop ? (samples.length - run.introN / 2) / 30 : (samples.length - 1) / 30),
    fields: keep.map(i => fields[i]), constants, eyeTypes, mouthTypes,
    props: {},
    rows: rows.map(r => keep.map(i => r[i])),
  };
  if (!eyeTypes.length) delete clip.eyeTypes;
  if (!mouthTypes.length) delete clip.mouthTypes;
  return clip;
}

// ---------- tolerance: interpolated 30 fps against the 60 fps rig ----------
const POS = ['x', 'y', 'edx', 'edy', 'mw', 'mdx', 'mdy', 'footL', 'footR'];
const ANG = ['tilt', 'footLRot', 'footRRot'];
const SCL = ['sx', 'sy', 'blink'];
const weights = (ty, pv, fd) => (pv == null || fd >= 1 ? { [ty]: 1 } : { [ty]: fd, [pv]: (1 - fd) + (pv === ty ? fd : 0) });
export function measure(clip, frames60, view = p => p, sampler = sample) {
  const e = { pos: 0, ang: 0, scale: 0, presence: 0, opacity: 0 }, where = {};
  frames60.forEach((truth0, j) => {
    const truth = view(truth0), s = sampler(clip, j / 60), got = { ...truth, ...s };
    let cur = '';
    const up = (k, v) => { if (Number.isFinite(v) && v > e[k]) { e[k] = v; where[k] = cur; } };
    for (const f of POS) if (f in truth) { cur = f; up('pos', Math.abs(got[f] - truth[f])); }
    for (const f of ANG) if (f in truth) { cur = f; up('ang', Math.abs(got[f] - truth[f])); }
    for (const f of SCL) if (f in truth) { cur = f; up('scale', Math.abs(got[f] - truth[f])); }
    cur = 'arm';
    for (const sd of ['L', 'R']) {
      const a = 'a' + sd;
      if (!(a in truth)) { if ((a + 'ang') in truth) up('ang', Math.abs(got[a + 'ang'] - truth[a + 'ang'])); continue; }
      cur = a; up('presence', Math.abs(got[a] - truth[a]));
      if (truth[a] > 0.25 && got[a] > 0.25) { // below a quarter the stub sits behind the tile
        up('pos', Math.abs(got[a + 'x'] - truth[a + 'x'])); up('pos', Math.abs(got[a + 'y'] - truth[a + 'y']));
        up('pos', Math.abs(got[a + 'len'] * got[a] - truth[a + 'len'] * truth[a]));
        up('ang', Math.abs(got[a + 'ang'] - truth[a + 'ang']));
      }
    }
    for (const d of DISC) {
      if (!(d in truth)) continue;
      cur = d;
      const w1 = weights(truth[d], truth[d + 'Prev'], truth[d + 'Fade']), w2 = weights(got[d], got[d + 'Prev'], got[d + 'Fade']);
      for (const k of new Set([...Object.keys(w1), ...Object.keys(w2)])) up('opacity', Math.abs((w1[k] || 0) - (w2[k] || 0)));
    }
  });
  for (const k in e) e[k] = +e[k].toPrecision(3);
  e.worstField = where;
  return e;
}

// ---------- main ----------
export function bakeAll(statesDoc) {
  const byKey = Object.fromEntries(statesDoc.states.map(s => [s.key, s]));
  const used = new Set(statesDoc.states.map(s => s.motion.id).concat([statesDoc.idle.motion, statesDoc.blink.motion]));
  for (const id of used) if (!MOTIONS[id]) throw new Error('states.json references unknown motion ' + id);
  const out = {}, report = {}, runs = {};
  for (const [id, def] of Object.entries(MOTIONS)) {
    let run, clip, view = p => p;
    if (def.kind === 'absolute') {
      const st = byKey[id];
      if (!st) throw new Error(`bespoke motion ${id} has no state with that key`);
      const actor = st.actors[0], rest = actor.rest;
      const ctx = { actor, ground: statesDoc.ground, groundY: (statesDoc.ground - actor.by) / actor.s };
      const targetAt = t => def.target(t, rest, ctx);
      run = def.loop ? runLoop(def, rest, targetAt, { intro: true }) : runOnce(def, rest, targetAt);
      clip = encode(id, def, run, ABS_FIELDS);
    } else {
      const n = neutralPose();
      const touched = new Set();
      for (let t = 0; t <= (def.dur || def.period); t += 0.05) Object.keys(def.target(t)).forEach(k => touched.add(k));
      const fields = [...ADD_FIELDS, ...MUL_FIELDS].filter(f => touched.has(f));
      for (const f of touched) if (!fields.includes(f)) throw new Error(`${id}: field ${f} cannot be additive`);
      const targetAt = t => ({ ...n, ...def.target(t) });
      run = def.loop ? runLoop(def, n, targetAt, { intro: false }) : runOnce(def, n, targetAt);
      // store offsets: add fields minus neutral, mul fields divided by neutral
      view = p => Object.fromEntries(fields.map(f => [f, ADD_FIELDS.includes(f) ? p[f] - n[f] : p[f] / n[f]]));
      run.frames = run.frames.map(view);
      view = p => p;
      clip = encode(id, def, run, fields);
    }
    out[id] = clip;
    runs[id] = run.frames;
    report[id] = {
      kind: clip.kind, plays: clip.loop ? 'loop' : 'once', new: !!def.isNew, frames: clip.frames, duration: clip.duration,
      fields: clip.fields.length, constants: Object.keys(clip.constants).length,
      endResidual: run.residual != null ? +run.residual.toPrecision(3) : undefined,
      loopSeam: run.seam != null ? +run.seam.toPrecision(3) : undefined,
      interpolationError: measure(clip, run.frames, view),
    };
  }
  return { clips: out, report, runs };
}

function writeJson(file, obj, depth) { fs.writeFileSync(file, stringify(obj, depth) + '\n'); }

async function main() {
  const doImport = process.argv.includes('--import') || !fs.existsSync(path.join(SPEC, 'states.json'));
  if (doImport) {
    const { states, palette } = importStates();
    writeJson(path.join(SPEC, 'palette.json'), palette, 3);
    writeJson(path.join(SPEC, 'states.json'), states, 5);
    console.log(`imported ${states.states.length} states from tools/source/blue-app-states.cjs`);
  }
  const statesDoc = JSON.parse(fs.readFileSync(path.join(SPEC, 'states.json'), 'utf8'));
  const { clips, report } = bakeAll(statesDoc);
  const mdir = path.join(SPEC, 'motion');
  fs.mkdirSync(mdir, { recursive: true });
  for (const f of fs.readdirSync(mdir)) if (f.endsWith('.json') && !clips[f.slice(0, -5)]) fs.rmSync(path.join(mdir, f));
  for (const [id, clip] of Object.entries(clips)) writeJson(path.join(mdir, id + '.json'), clip, 2);

  const size = files => {
    const buf = Buffer.concat(files.map(f => fs.readFileSync(f)));
    return { rawKB: +(buf.length / 1024).toFixed(1), gzipKB: +(zlib.gzipSync(buf, { level: 9 }).length / 1024).toFixed(1) };
  };
  const motionFiles = fs.readdirSync(mdir).filter(f => f.endsWith('.json')).map(f => path.join(mdir, f));
  const worst = { pos: 0, ang: 0, scale: 0, presence: 0, opacity: 0 };
  for (const r of Object.values(report)) for (const k of Object.keys(worst)) worst[k] = Math.max(worst[k], r.interpolationError[k]);
  const full = {
    note: 'interpolationError: max abs difference between linear interpolation of the stored 30 fps frames and the 60 fps rig, at every 60 fps instant. pos in body units (x 2.2 = px on the 240 canvas for a lone Buddy), ang in degrees, scale and presence unitless, opacity per eye or mouth shape. endResidual: largest gap closed when the last frame is snapped to the rest pose. loopSeam: rig drift over one loop period.',
    worst,
    sizes: {
      motion: size(motionFiles),
      states: size([path.join(SPEC, 'states.json')]),
      palette: size([path.join(SPEC, 'palette.json')]),
      motionPlusStates: size([...motionFiles, path.join(SPEC, 'states.json')]),
    },
    clips: report,
  };
  fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
  writeJson(path.join(ROOT, 'reports', 'bake-report.json'), full, 3);
  genWebData();
  console.log(`baked ${Object.keys(clips).length} clips; worst interpolation error ${JSON.stringify(worst)}`);
  console.log('sizes', JSON.stringify(full.sizes));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
