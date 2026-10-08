// npm run render-svg -- <state> [--phase rest|motion|idle] [--frame N | --t S] [--surface light|dark]
//                              [--background card] [--size 240] [--out file.svg]
// Prints one frame as SVG (or writes it with --out).
import fs from 'node:fs';
import { loadWeb, args, frameInfo } from './lib/web.mjs';

const a = args(), key = a._[0];
if (!key) { console.error('usage: render-svg <state> [--phase motion --frame 12] [--surface dark] [--out f.svg]'); process.exit(1); }
const web = await loadWeb();
const svg = web.renderFrameSvg(key, frameInfo(a), { surface: a.surface || 'light', size: a.size ? +a.size : 240, background: a.background });
if (a.out) fs.writeFileSync(a.out, svg); else process.stdout.write(svg + '\n');
