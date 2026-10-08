// A parser for the small SVG subset the state generator emits: rect, circle, ellipse, path and g,
// plus the <actor i="n"/> markers the importer puts where a Buddy was drawn. Anything else throws,
// so a new element kind in the generator cannot slip through silently.

const KINDS = new Set(['rect', 'circle', 'ellipse', 'path', 'g', 'actor']);

export function parseFragment(markup) {
  const root = { tag: 'root', attrs: {}, children: [] };
  const stack = [root];
  const re = /<(\/?)([a-zA-Z]+)((?:\s+[a-zA-Z-]+="[^"]*")*)\s*(\/?)>/g;
  let m, last = 0;
  while ((m = re.exec(markup))) {
    if (markup.slice(last, m.index).trim()) throw new Error('unexpected text: ' + markup.slice(last, m.index));
    last = re.lastIndex;
    const [, close, tag, attrStr, self] = m;
    if (!KINDS.has(tag)) throw new Error('unsupported element <' + tag + '>');
    if (close) {
      const top = stack.pop();
      if (top.tag !== tag) throw new Error(`mismatched </${tag}>`);
      continue;
    }
    const attrs = {};
    for (const a of attrStr.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
    const node = { tag, attrs, children: [] };
    stack[stack.length - 1].children.push(node);
    if (!self) stack.push(node);
  }
  if (markup.slice(last).trim()) throw new Error('trailing text');
  if (stack.length !== 1) throw new Error('unclosed element');
  return root.children;
}

// "translate(1 2) rotate(30 4 5) scale(2)" -> [["translate",1,2],["rotate",30,4,5],["scale",2,2]]
export function parseTransform(s) {
  if (!s) return [];
  const out = [];
  for (const m of s.matchAll(/(translate|scale|rotate)\(([^)]*)\)/g)) {
    const n = m[2].trim().split(/[\s,]+/).map(Number);
    if (n.some(v => !Number.isFinite(v))) throw new Error('bad transform ' + s);
    if (m[1] === 'translate') out.push(['translate', n[0], n[1] ?? 0]);
    else if (m[1] === 'scale') out.push(['scale', n[0], n[1] ?? n[0]]);
    else out.push(n.length === 3 ? ['rotate', n[0], n[1], n[2]] : ['rotate', n[0], 0, 0]);
  }
  const rest = s.replace(/(translate|scale|rotate)\(([^)]*)\)/g, '').trim();
  if (rest) throw new Error('unsupported transform part: ' + rest);
  return out;
}
