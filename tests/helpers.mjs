import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const readJson = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
export const web = () => import(pathToFileURL(path.join(ROOT, 'packages/web/dist/index.js')).href);

// Well-formedness for the SVG the renderer emits: tags balance, attributes are quoted, no NaN.
export function checkSvg(svg) {
  if (!svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')) throw new Error('not an svg root');
  if (/NaN|undefined|Infinity|null/.test(svg)) throw new Error('bad value in svg');
  const stack = [];
  const re = /<(\/?)([a-zA-Z]+)((?:\s+[a-zA-Z-]+="[^"<>]*")*)\s*(\/?)>/g;
  let m, last = 0;
  while ((m = re.exec(svg))) {
    if (svg.slice(last, m.index).trim()) throw new Error('stray text: ' + svg.slice(last, m.index).slice(0, 40));
    last = re.lastIndex;
    if (m[1]) { if (stack.pop() !== m[2]) throw new Error('mismatched </' + m[2] + '>'); }
    else if (!m[4]) stack.push(m[2]);
  }
  if (last !== svg.length) throw new Error('unparsed tail');
  if (stack.length) throw new Error('unclosed ' + stack);
}
