// One-off importer: builds spec/palette.json and spec/states.json from the copied state generator
// (tools/source/blue-app-states.cjs). After the import, spec/ is the hand-edited source of truth;
// re-importing overwrites hand edits, so bake only runs this with --import.
//
// How it works: the generator is run with a hook on `put` (where it draws a Buddy). Each Buddy becomes
// an <actor/> marker plus its options, which become an actor placement and a rest pose. Everything else
// in the state's markup is a prop: it is parsed into primitives, with colours mapped back to palette
// tokens by running the generator with sentinel colours.
import { loadGenerator } from './lib/sources.mjs';
import { parseFragment, parseTransform } from './lib/svg-subset.mjs';
import { normaliseD } from './lib/path-data.mjs';
import { neutralPose, EYE_TYPES, MOUTH_TYPES, ARM_DEFAULT } from './lib/pose.mjs';
import { BESPOKE } from './motion/definitions.mjs';

const r3 = v => Math.round(v * 1000) / 1000;

export const PALETTE = {
  format: 1,
  tokens: {
    body: '#A4D4E3', feet: '#A4D4E3', arm: '#A4D4E3', shadow: '#7FBFD3',
    navy: '#00275C', ghost: '#CBE6EE', deep: '#00588C', mapLine: '#B5D9E4',
    coral: '#F28B7D', coralLight: '#F8BFB8', coralDark: '#AE6F74', onCoral: '#00275C',
    mint: '#8FD6B5', white: '#FFFFFF', card: '#F4F4F2',
  },
};

// Sentinels for the generator's palette object C; constants it uses directly map by hex.
const SENTINEL = {
  body: '#000101', feet: '#000102', light: '#000103', deep: '#000104', shadow: '#000105',
  acc: '#000106', accLight: '#000107', accDark: '#000108', onAcc: '#000109', arm: '#00010A',
};
const TOKEN_OF = {
  '#000101': 'body', '#000102': 'feet', '#000103': 'ghost', '#000104': 'deep', '#000105': 'shadow',
  '#000106': 'coral', '#000107': 'coralLight', '#000108': 'coralDark', '#000109': 'onCoral', '#00010A': 'arm',
  '#00275C': 'navy', '#B5D9E4': 'mapLine', '#FFFFFF': 'white',
};

function paletteDoc() {
  const light = { ...PALETTE.tokens };
  const dark = { ...PALETTE.tokens, shadow: null };
  return {
    format: 1,
    $comment: 'Colour tokens. Scenes and the player name tokens, never hex. A null token is not drawn. "card" is the reference background (not part of any scene).',
    tokens: Object.keys(light),
    surfaces: { light, dark },
  };
}

// --- arms -------------------------------------------------------------------------------------------
// The generator draws arms as rounded rects 9 units thick, some rotated. Every one is the same capsule
// the engine draws: rect(ax-4.5, ay-len, 9, len+4.5, rx 4.5) rotated `ang` about the anchor (ax, ay).
function capsule(x, y, w, h, side, rot) {
  let ax, ay, len, ang;
  if (w === 9) { ax = x + 4.5; ay = y + h - 4.5; len = h - 4.5; ang = 0; }
  else if (h === 9) {
    len = w - 4.5; ay = y + 4.5;
    if (side === 'L') { ax = x + w - 4.5; ang = -90; } else { ax = x + 4.5; ang = 90; }
  } else throw new Error('arm rect is not 9 units thick');
  if (rot) {
    const [t, px, py] = rot, q = t * Math.PI / 180, dx = ax - px, dy = ay - py;
    ax = px + dx * Math.cos(q) - dy * Math.sin(q); ay = py + dx * Math.sin(q) + dy * Math.cos(q); ang += t;
  }
  return { x: ax, y: ay, ang, len };
}
const H = 54, W = 64;
const f2 = v => +(+v).toFixed(2);
const PRESET = {
  side: s => s === 'L' ? capsule(-6, f2(H * 0.52), 11, 9, s) : capsule(W - 5, f2(H * 0.52), 11, 9, s),
  up: s => s === 'L' ? capsule(-2, f2(H * 0.08), 9, 22, s, [-28, 2.5, f2(H * 0.08 + 20)]) : capsule(W - 7, f2(H * 0.08), 9, 22, s, [28, f2(W - 2.5), f2(H * 0.08 + 20)]),
  out: s => s === 'L' ? capsule(-17, f2(H * 0.5), 21, 9, s) : capsule(W - 4, f2(H * 0.5), 21, 9, s),
  shrug: s => s === 'L' ? capsule(-4, f2(H * 0.22), 9, 20, s, [-58, 0.5, f2(H * 0.22 + 18)]) : capsule(W - 5, f2(H * 0.22), 9, 20, s, [58, f2(W - 0.5), f2(H * 0.22 + 18)]),
};

export function restPoseFromOptions(o, key) {
  const p = neutralPose();
  const et = Array.isArray(o.eyes) ? o.eyes : [o.eyes || 'oval', o.eyes || 'oval'];
  for (const e of et) if (!EYE_TYPES.includes(e)) throw new Error(`${key}: unknown eye ${e}`);
  const mouth = o.mouth || 'curve';
  if (!MOUTH_TYPES.includes(mouth)) throw new Error(`${key}: unknown mouth ${mouth}`);
  const L = (o.lift || {}).L || [0, 0], R = (o.lift || {}).R || [0, 0];
  Object.assign(p, {
    tilt: o.tilt || 0, sx: o.sx || 1, sy: o.sy || 1, eyeL: et[0], eyeR: et[1], edx: o.edx || 0, edy: o.edy || 0,
    mouth, mw: o.mw || 7, mdx: o.mdx || 0, mdy: o.mdy || 0,
    footL: -L[1] || 0, footR: -R[1] || 0, footLRot: L[0] || 0, footRRot: R[0] || 0,
    fold: o.fold ? 1 : 0, badge: o.clip ? 1 : 0,
  });
  const slot = { L: null, R: null };
  const set = (s, c) => { if (slot[s]) throw new Error(`${key}: two arms on side ${s}`); slot[s] = c; };
  if (o.armL && o.armL !== 'none') set('L', PRESET[o.armL]('L'));
  if (o.armR && o.armR !== 'none') set('R', PRESET[o.armR]('R'));
  for (const a of o.arms || []) {
    if (a[0] !== 'L' && a[0] !== 'R') throw new Error(`${key}: numeric arm anchor not supported`);
    set(a[0], { x: a[0] === 'L' ? 3 : W - 3, y: H * a[1], ang: a[2], len: a[3], thumb: a[4] === 'thumb' ? 1 : 0 });
  }
  for (const s of ['L', 'R']) {
    const c = slot[s];
    if (!c) { Object.assign(p, { ['a' + s]: 0, ['a' + s + 'x']: ARM_DEFAULT[s].x, ['a' + s + 'y']: ARM_DEFAULT[s].y, ['a' + s + 'ang']: 0, ['a' + s + 'len']: ARM_DEFAULT[s].len, ['a' + s + 'thumb']: 0 }); continue; }
    Object.assign(p, { ['a' + s]: 1, ['a' + s + 'x']: r3(c.x), ['a' + s + 'y']: r3(c.y), ['a' + s + 'ang']: r3(c.ang), ['a' + s + 'len']: r3(c.len), ['a' + s + 'thumb']: c.thumb || 0 });
  }
  for (const k of Object.keys(p)) if (typeof p[k] === 'number') p[k] = r3(p[k]);
  return p;
}

// --- props ------------------------------------------------------------------------------------------
const num = (v, def = 0) => (v == null ? def : r3(+v));
function paint(attrs, key) {
  const tok = v => {
    if (v == null || v === 'none') return null;
    const t = TOKEN_OF[v.toUpperCase()];
    if (!t) throw new Error(`${key}: colour ${v} has no palette token`);
    return t;
  };
  const out = {};
  let fill = attrs.fill;
  // SVG paints a missing fill black. The only case in the generator is the map's two fold lines
  // (stroke only, zero area), so a missing fill on a stroked shape is treated as no fill.
  if (fill == null) { if (!attrs.stroke) throw new Error(`${key}: shape without fill or stroke`); fill = 'none'; }
  out.fill = tok(fill);
  if (attrs.stroke) {
    out.stroke = tok(attrs.stroke);
    out.strokeWidth = num(attrs['stroke-width'], 1);
    out.cap = attrs['stroke-linecap'] || 'butt';
    out.join = attrs['stroke-linejoin'] || 'miter';
  }
  return out;
}

function convert(node, key) {
  const a = node.attrs;
  const tf = parseTransform(a.transform).map(t => [t[0], ...t.slice(1).map(r3)]);
  const withTf = o => (tf.length ? { ...o, transform: tf } : o);
  switch (node.tag) {
    case 'actor': return { type: 'actor', actor: +a.i };
    case 'g': {
      const extra = Object.keys(a).filter(k => k !== 'transform');
      if (extra.length) throw new Error(`${key}: <g> with ${extra}`);
      return withTf({ type: 'group', children: node.children.map(c => convert(c, key)) });
    }
    case 'rect': {
      const w = num(a.width), h = num(a.height), rx = num(a.rx);
      // SVG clamps the corner radius per axis; store the clamped pair so no player has to.
      return withTf({ type: 'rect', x: num(a.x), y: num(a.y), w, h, rx: r3(Math.min(rx, w / 2)), ry: r3(Math.min(rx, h / 2)), ...paint(a, key) });
    }
    case 'circle': return withTf({ type: 'circle', cx: num(a.cx), cy: num(a.cy), r: num(a.r), ...paint(a, key) });
    case 'ellipse': return withTf({ type: 'ellipse', cx: num(a.cx), cy: num(a.cy), rx: num(a.rx), ry: num(a.ry), ...paint(a, key) });
    case 'path': return withTf({ type: 'path', d: normaliseD(a.d), ...paint(a, key) });
  }
  throw new Error('unreachable');
}

export function importStates() {
  const G = loadGenerator({ hookPut: true });
  G.setPalette(SENTINEL);
  const keys = G.ST.map(s => s[0]);
  const states = [];
  try {
    for (const [key, group, name, use, art] of G.ST) {
      const actors = [];
      globalThis.__mascotPutHook = (cx, by, s, o) => {
        actors.push({ cx: r3(cx), by: r3(by), s: r3(s), shadow: !o.noShadow, rest: restPoseFromOptions(o, key) });
        return `<actor i="${actors.length - 1}"/>`;
      };
      const nodes = parseFragment(art());
      const layers = nodes.map(n => convert(n, key));
      const deepActor = JSON.stringify(layers.filter(l => l.type === 'group')).includes('"actor"');
      if (deepActor) throw new Error(`${key}: an actor inside a group is not supported`);
      if (layers.filter(l => l.type === 'actor').length !== actors.length) throw new Error(`${key}: actor count`);
      states.push({ key, group, name, use, actors, layers, motion: motionFor(key, actors.length) });
    }
  } finally {
    delete globalThis.__mascotPutHook;
    G.setPalette();
  }
  return {
    states: {
      format: 1,
      $comment: 'All mascot states. Coordinates: scene units on a 240 by 240 canvas; actor poses in body units (tile 64 by 54). See spec/README.md and docs/renderer-contract.md.',
      canvas: { width: 240, height: 240 },
      ground: 196,
      groups: G.GROUPS,
      idle: { motion: 'idle', actorOffset: 0.7 },
      blink: { motion: 'blink', gapMin: 2, gapMax: 6, doubleChance: 0.2, doubleGap: 0.3 },
      states,
    },
    palette: paletteDoc(),
    keys,
  };
}

function motionFor(key, nActors) {
  if (key === 'loading') {
    // Three Buddies in a staircase: the same hop loop, a third of a hop apart.
    return { id: 'loading', plays: 'loop', then: null, actors: Array.from({ length: nActors }, (_, i) => ({ actor: i, offset: r3(i * 0.8 / 3) })) };
  }
  if (BESPOKE.includes(key)) return { id: key, plays: 'once', then: 'idle', actors: [{ actor: 0, offset: 0 }] };
  return { id: 'pop', plays: 'once', then: 'idle', actors: Array.from({ length: nActors }, (_, i) => ({ actor: i, offset: r3(i * 0.08) })) };
}
