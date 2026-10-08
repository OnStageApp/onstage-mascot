// Loads the two copied sources in tools/source without touching their text on disk.
// The generator can be loaded with a hook on `put`, so the importer can tell Buddy apart from props.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SOURCE_DIR = path.join(here, '..', 'source');
export const GENERATOR_PATH = path.join(SOURCE_DIR, 'blue-app-states.cjs');
export const ENGINE_PATH = path.join(SOURCE_DIR, 'buddy-anim.cjs');

const PUT = 'const put=(cx,by,s,o)=>';

function evalCjs(file, src) {
  const module = { exports: {} };
  const req = createRequire(file);
  const r = id => req(id);
  r.main = null; // so the generator's `require.main===module` guard never writes files
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', 'require', '__filename', '__dirname', src)(module, module.exports, r, file, path.dirname(file));
  return module.exports;
}

// hookPut: when true, every Buddy drawn by the generator calls globalThis.__mascotPutHook(cx, by, s, o)
// if it is set, and its return value replaces the Buddy markup (shadow included).
export function loadGenerator({ hookPut = false } = {}) {
  let src = readFileSync(GENERATOR_PATH, 'utf8');
  if (hookPut) {
    if (src.split(PUT).length !== 2) throw new Error('generator `put` signature changed; update tools/lib/sources.mjs');
    src = src.replace(PUT, PUT + 'globalThis.__mascotPutHook?globalThis.__mascotPutHook(cx,by,s,o):');
  }
  return evalCjs(GENERATOR_PATH, src);
}

export function loadEngine() {
  return evalCjs(ENGINE_PATH, readFileSync(ENGINE_PATH, 'utf8'));
}

// The reference card SVG for a state, exactly as the generator wrote blue-app-states/svg.
export function referenceSvg(G, i) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" fill="#F4F4F2"/>${G.ST[i][4]()}</svg>`;
}
