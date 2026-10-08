// npm run parity:web:static [-- --out tests/parity/web-static --size 480]
// The static counterpart of render-web-frames.mjs: the resting pose of all 85 states on both surfaces,
// from the static entry (renderRestSvg), rasterised by rsvg-convert on the card colour. Writes PNGs and
// tests/parity/manifest-static.json. Flutter renders the same manifest with BuddyStatic
// (packages/flutter/test/parity_static_test.dart), then
//   python3 tests/parity/compare.py --a tests/parity/web-static --b <flutter folder> --manifest tests/parity/manifest-static.json
// The SVG is transparent (that is what an app draws); the card colour is added by the rasteriser here
// and by a ColoredBox behind BuddyStatic in Flutter, so the comparison also covers the transparency.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { args, ROOT, RSVG } from '../../tools/lib/web.mjs';

const a = args();
const size = +(a.size || 480), out = path.resolve(a.out || path.join(ROOT, 'tests', 'parity', 'web-static'));
const stat = await import(pathToFileURL(path.join(ROOT, 'packages', 'web', 'dist', 'static.js')).href);
const palette = JSON.parse(fs.readFileSync(path.join(ROOT, 'spec', 'palette.json'), 'utf8'));
const background = 'card';

const cases = [];
for (const surface of ['light', 'dark']) {
  stat.STATE_KEYS.forEach((key, i) => cases.push({ file: `static-${surface}-${String(i + 1).padStart(2, '0')}-${key}.png`, state: key, surface }));
}
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const c of cases) {
  const svg = stat.renderRestSvg(c.state, { surface: c.surface, size });
  const bg = palette.surfaces[c.surface][background];
  execFileSync(RSVG, ['-w', String(size), '-h', String(size), '-b', bg, '-o', path.join(out, c.file)], { input: svg });
}
const manifest = {
  format: 1,
  note: 'Static mode. Render each case with BuddyStatic at size x size px on the palette token "card" of the case\'s surface (the widget itself is transparent). 85 states, light and dark.',
  size, background, cases,
};
fs.writeFileSync(path.join(out, 'manifest-static.json'), JSON.stringify(manifest, null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'tests', 'parity', 'manifest-static.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log(`wrote ${cases.length} PNGs (${size} px) to ${path.relative(ROOT, out)}`);
