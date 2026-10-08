// node tools/rename.mjs component=Pip npmName=@onstage/pip dartPackage=onstage_pip repo=onstage-pip
// Updates mascot.config.json and replaces the old value with the new one in every text file of the repo,
// except tools/source (verbatim copies), node_modules, out and reports. Then run: npm run build && npm test.
// The component name is replaced as a whole word only. Review the diff before committing.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/web.mjs';

const cfgPath = path.join(ROOT, 'mascot.config.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const pairs = process.argv.slice(2).map(a => a.split('='));
if (!pairs.length || pairs.some(([k, v]) => !(k in cfg) || k.startsWith('$') || !v)) {
  console.error('usage: node tools/rename.mjs <key>=<value> ...  keys: ' + Object.keys(cfg).filter(k => !k.startsWith('$')).join(', '));
  process.exit(1);
}
const SKIP = new Set(['node_modules', '.git', 'out', 'reports', 'tools/source', 'tests/fixtures', 'tests/parity/web', 'packages/web/dist']);
const TEXT = /\.(m?js|ts|tsx|json|md|html|py|yaml|dart|cjs)$/;
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory() && SKIP.has(path.relative(ROOT, p))) continue;
    if (e.isDirectory()) walk(p); else if (TEXT.test(e.name) && e.name !== 'package-lock.json') files.push(p);
  }
})(ROOT);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let changed = 0;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8'); const before = s;
  for (const [k, v] of pairs) s = s.replace(new RegExp(k === 'component' ? `\\b${esc(cfg[k])}\\b` : esc(cfg[k]), 'g'), v);
  if (s !== before) { fs.writeFileSync(f, s); changed++; console.log('updated', path.relative(ROOT, f)); }
}
console.log(`${changed} files changed`);
