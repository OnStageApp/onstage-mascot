// npm run parity:web [-- --out tests/parity/web --size 480]
// Renders the fixed parity set with the web player: each of the 15 key states at motion frames
// 0, mid and end, plus all 85 resting frames. Writes PNGs and manifest.json. The Flutter player
// renders the same manifest (same names, size and background) into its own folder, then:
//   python3 tests/parity/compare.py --a tests/parity/web --b <flutter folder> --manifest tests/parity/manifest.json
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadWeb, args, ROOT, RSVG } from '../../tools/lib/web.mjs';
import { BESPOKE } from '../../tools/motion/definitions.mjs';

const a = args(), web = await loadWeb();
const size = +(a.size || 480), out = path.resolve(a.out || path.join(ROOT, 'tests', 'parity', 'web'));
const background = 'card';

export function parityCases(webMod) {
  const cases = [];
  for (const key of BESPOKE) {
    const st = webMod.getState(key), clip = webMod.SPEC.motion[st.motion.id], last = clip.frames - 1;
    for (const frame of [...new Set([0, Math.floor(last / 2), last])]) {
      cases.push({ file: `motion-${key}-f${String(frame).padStart(3, '0')}.png`, state: key, phase: 'motion', frame, t: frame / clip.fps });
    }
  }
  webMod.STATE_KEYS.forEach((key, i) => cases.push({ file: `rest-${String(i + 1).padStart(2, '0')}-${key}.png`, state: key, phase: 'rest', frame: 0, t: 0 }));
  return cases;
}

const cases = parityCases(web);
fs.mkdirSync(out, { recursive: true });
for (const c of cases) {
  const svg = web.renderFrameSvg(c.state, { phase: c.phase, frame: c.frame }, { size, background });
  execFileSync(RSVG, ['-w', String(size), '-h', String(size), '-o', path.join(out, c.file)], { input: svg });
}
const manifest = {
  format: 1,
  note: 'Render each case at size x size px, opaque, with the palette token "card" (light surface) filling the canvas behind the scene. frame is a 30 fps index into the phase clip (t = frame / 30 s). Blink factor 1, light surface.',
  size, surface: 'light', background, cases,
};
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'tests', 'parity', 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log(`wrote ${cases.length} PNGs (${size} px) to ${path.relative(ROOT, out)}`);
