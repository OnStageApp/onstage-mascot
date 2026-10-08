// npm run render-png -- <state> [--phase motion --frame N | --t S] [--surface dark] [--background card]
//                              [--size 480] [--out out/<state>.png]
// One frame to PNG via rsvg-convert. With --all, every state's rest pose into out/rest/.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadWeb, args, frameInfo, ROOT, RSVG } from './lib/web.mjs';

export function svgToPng(svg, file, size) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  execFileSync(RSVG, ['-w', String(size), '-h', String(size), '-o', file], { input: svg });
}

const a = args();
const web = await loadWeb();
const size = a.size ? +a.size : 480, surface = a.surface || 'light';
if (a.all) {
  const dir = a.out || path.join(ROOT, 'out', 'rest');
  web.STATE_KEYS.forEach((k, i) => svgToPng(web.renderFrameSvg(k, {}, { surface, size, background: a.background }), path.join(dir, `${String(i + 1).padStart(2, '0')}-${k}.png`), size));
  console.log(`wrote ${web.STATE_KEYS.length} PNGs to ${dir}`);
} else {
  const key = a._[0];
  if (!key) { console.error('usage: render-png <state> [--phase motion --frame N] [--size 480] [--out f.png] | --all'); process.exit(1); }
  const out = a.out || path.join(ROOT, 'out', `${key}.png`);
  svgToPng(web.renderFrameSvg(key, frameInfo(a), { surface, size, background: a.background }), out, size);
  console.log(out);
}
