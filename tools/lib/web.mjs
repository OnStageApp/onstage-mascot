// Tools render through the built web package, so there is one renderer. Run `npm run build` first.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const RSVG = process.env.RSVG_CONVERT || '/opt/homebrew/bin/rsvg-convert';

export async function loadWeb() {
  const entry = path.join(ROOT, 'packages', 'web', 'dist', 'index.js');
  if (!fs.existsSync(entry)) throw new Error('packages/web/dist is missing: run `npm run build`');
  return import(pathToFileURL(entry).href);
}

// Minimal flag parser: --key value, --flag, positional args.
export function args(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2), v = argv[i + 1];
      if (v == null || v.startsWith('--')) out[k] = true; else { out[k] = v; i++; }
    } else out._.push(a);
  }
  return out;
}

// FrameInfo from flags: --phase rest|motion|idle, --frame N or --t seconds
export function frameInfo(a) {
  const f = { phase: a.phase || (a.frame != null || a.t != null ? 'motion' : 'rest') };
  if (a.frame != null) f.frame = +a.frame;
  if (a.t != null) f.t = +a.t;
  return f;
}
