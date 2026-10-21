// npm run contact-sheet                      every state's rest pose, grouped, labelled -> out/contact-sheet.png
// npm run contact-sheet -- --motion <state>  that state's motion, every --step frames (default 4)
// npm run contact-sheet -- --clip <id>      an additive clip (hop, glance-left, ...) on top of a state's idle
//                                            (--state, default excited), every --step frames (default 2)
// Options: --surface dark, --cols 8, --cell 160, --out file.png
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadWeb, args, ROOT, RSVG } from './lib/web.mjs';

const a = args(), web = await loadWeb();
const surface = a.surface || 'light', cols = +(a.cols || 8), cell = +(a.cell || 160), pad = 24, label = 34;
const P = web.SPEC.palette.surfaces[surface];
const bg = surface === 'dark' ? P.navy : '#FFFFFF', ink = surface === 'dark' ? '#FFFFFF' : P.navy, card = surface === 'dark' ? '#0B3470' : P.card;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

let items;
if (a.clip) {
  const key = a.state || 'excited', clip = web.getOverlayClip(a.clip), step = +(a.step || 2);
  items = [];
  for (let f = 0; f < clip.frames; f += step) items.push({ key, frame: { phase: 'idle', t: 0, overlay: { clip: a.clip, t: f / clip.fps } }, title: `${a.clip} ${f}`, sub: `${(f / clip.fps).toFixed(2)} s` });
} else if (a.motion) {
  const st = web.getState(a.motion), clip = web.SPEC.motion[st.motion.id], step = +(a.step || 4);
  items = [];
  for (let f = 0; f < clip.frames; f += step) items.push({ key: st.key, frame: { phase: 'motion', frame: f }, title: `frame ${f}`, sub: `${(f / clip.fps).toFixed(2)} s` });
  if ((clip.frames - 1) % step) items.push({ key: st.key, frame: { phase: 'motion', frame: clip.frames - 1 }, title: `frame ${clip.frames - 1}`, sub: 'end' });
} else {
  items = web.SPEC.states.states.map(s => ({ key: s.key, frame: {}, title: s.key, sub: `${s.motion.id}${s.motion.plays === 'loop' ? ' (loop)' : ''}` }));
}
const rows = Math.ceil(items.length / cols), W = pad * 2 + cols * cell + (cols - 1) * pad, H = pad * 2 + rows * (cell + label) + (rows - 1) * pad;
let body = '';
items.forEach((it, i) => {
  const x = pad + (i % cols) * (cell + pad), y = pad + Math.floor(i / cols) * (cell + label + pad);
  const svg = web.renderFrameSvg(it.key, it.frame, { surface }).replace('<svg ', `<svg x="${x}" y="${y}" width="${cell}" height="${cell}" `);
  body += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="14" fill="${card}"/>${svg}`
    + `<text x="${x + 2}" y="${y + cell + 16}" font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="${ink}">${esc(it.title)}</text>`
    + `<text x="${x + 2}" y="${y + cell + 30}" font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="11" fill="${ink}" opacity="0.6">${esc(it.sub)}</text>`;
});
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${bg}"/>${body}</svg>`;
const name = a.clip ? `clip-${a.clip}` : a.motion ? `motion-${a.motion}` : 'contact-sheet';
const out = a.out || path.join(ROOT, 'out', `${name}${surface === 'dark' ? '-dark' : ''}.png`);
fs.mkdirSync(path.dirname(out), { recursive: true });
execFileSync(RSVG, ['-o', out], { input: sheet });
console.log(out);
