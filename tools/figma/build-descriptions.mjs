// node tools/figma/build-descriptions.mjs [--pretty]
// Prints {"setDescription": "...", "variants": {"<key>": "<description>"}} built from spec/.
// Paste the output into set-descriptions.js (replace __DESCRIPTIONS__). ASCII only, no em dashes.
// Avoid < > & and apostrophes: the Figma tool escapes them into HTML entities in descriptions.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const states = JSON.parse(fs.readFileSync(path.join(ROOT, 'spec/states.json'), 'utf8')).states;
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'mascot.config.json'), 'utf8'));
const clip = (id) => JSON.parse(fs.readFileSync(path.join(ROOT, 'spec/motion', `${id}.json`), 'utf8'));
const sentence = (s) => (/[.!?]$/.test(s) ? s : s + '.');

const variants = {};
for (const s of states) {
  const m = s.motion, c = clip(m.id), secs = `${(+c.duration).toFixed(1)} s`;
  const how = m.plays === 'loop' ? `loops, ${secs} period` : `plays once, ${secs}, then ${m.then || 'stops'}`;
  variants[s.key] = `Key: ${s.key}. Motion: ${m.id} (${how}). Use it for: ${sentence(s.use)}`;
}

const repo = cfg.repo || 'onstage-mascot';
const MARK = 'Sync with code:';
const setDescriptionTail =
  `${MARK} the variant name state=KEY is the state key from spec/states.json in the ${repo} repo. ` +
  `The resting pose of every variant equals the resting frame in code, checked by pixel comparison ` +
  `(tools/figma/compare.py). If they ever differ, code wins. Each variant description lists its motion.`;

const out = { mark: MARK, setDescriptionTail, variants };
for (const [k, v] of Object.entries({ ...variants, tail: setDescriptionTail })) {
  if (/[^\x20-\x7e]|[<>&'"]/.test(v)) { console.error('non-ASCII text in', k, v); process.exit(1); }
}
process.stdout.write(JSON.stringify(out, null, process.argv.includes('--pretty') ? 1 : 0) + '\n');
