// Extra parity cases beyond tests/parity/manifest.json, for the Flutter port: every crossfade
// frame of every clip (whole and half frames, so mixDiscrete runs between samples), the idle phase
// at odd times, the additive pop clip, the loop clip past its intro, explicit blink factors, and
// the dark surface. Renders them with the web player and writes, under tests/parity/out/flutter/extra:
//   manifest.json, web/<file>.png
// test/parity_render_test.dart renders the same cases into extra/flutter/ when the manifest exists.
// Run from the repo root (after npm run build): node packages/flutter/tool/extra-parity-web.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadWeb, ROOT, RSVG } from '../../../tools/lib/web.mjs';

const web = await loadWeb();
const size = 480, background = 'card';
const out = path.join(ROOT, 'tests', 'parity', 'out', 'flutter', 'extra');
const cases = [];
const add = (state, phase, t, extra = {}) => {
  const tag = `${phase}-${state}-t${t.toFixed(4)}${extra.blink ? '-b' + extra.blink.join('_') : ''}${extra.surface ? '-' + extra.surface : ''}`;
  cases.push({ file: tag.replace(/[^a-z0-9._-]/gi, '_') + '.png', state, phase, t, ...extra });
};

// Crossfades: every row with a fade strictly between 0 and 1, at the row and half a row later.
for (const st of web.SPEC.states.states) {
  const clip = web.SPEC.motion[st.motion.id];
  if (!clip || clip.kind !== 'absolute') continue;
  const col = Object.fromEntries(clip.fields.map((f, i) => [f, i]));
  clip.rows.forEach((r, i) => {
    const fading = ['eyeLFade', 'eyeRFade', 'mouthFade'].some(k => k in col && r[col[k]] > 0 && r[col[k]] < 1);
    if (fading) { add(st.key, 'motion', i / clip.fps); add(st.key, 'motion', (i + 0.5) / clip.fps); }
  });
}
// Idle at odd times, for states with one, two and three actors.
const multi = web.SPEC.states.states.filter(s => s.actors.length > 1).map(s => s.key);
for (const key of ['hello', 'no-events', 'oops', ...multi]) for (const t of [0.37, 1.234, 2.9, 4.51]) add(key, 'idle', t);
// The additive pop clip (every state without its own motion) at odd times.
for (const key of ['saved', 'swap', 'lost', 'singing']) for (const t of [0.21, 0.55, 0.9]) add(key, 'motion', t);
// The loop clip past its intro and across the wrap.
for (const t of [1.55, 1.6, 1.61, 2.39, 3.21, 7.777]) add('loading', 'motion', t);
// Explicit blink factors on every eye kind that blinks.
for (const kind of ['oval', 'big', 'small']) {
  const keys = web.STATE_KEYS.filter(k => web.getState(k).actors.some(a => a.rest.eyeL === kind || a.rest.eyeR === kind));
  for (const key of keys.slice(0, 2)) add(key, 'rest', 0, { blink: web.getState(key).actors.map(() => 0.35) });
}
// Dark surface (no ground shadow).
for (const key of ['hello', 'loading', 'swap', 'session-expired']) add(key, 'rest', 0, { surface: 'dark' });

fs.mkdirSync(path.join(out, 'web'), { recursive: true });
for (const c of cases) {
  const svg = web.renderFrameSvg(c.state, { phase: c.phase, t: c.t, blink: c.blink }, { size, background, surface: c.surface ?? 'light' });
  execFileSync(RSVG, ['-w', String(size), '-h', String(size), '-o', path.join(out, 'web', c.file)], { input: svg });
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ format: 1, size, background, cases }, null, 1) + '\n');
console.log(`wrote ${cases.length} extra web PNGs to ${path.relative(ROOT, out)}`);
