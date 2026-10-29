// Draws a resolved scene as an SVG string. Pure and deterministic: the same input gives the same string.
// Geometry follows docs/renderer-contract.md exactly; keep the two in step.
// This file has no data import: the palette, canvas and ground come in as a DrawSpec, so the static
// entry (static-svg.ts) can use it without pulling in the motion data. svg.ts binds it to SPEC.
import type { Layer, Pose, Prim, PropDef, StateDef, Surface, TransformOp, Paint, EyeType, MouthType, PaletteDoc } from './types.js';

/** What drawing needs from the spec: the palette, the canvas size and the ground line. */
export interface DrawSpec {
  palette: PaletteDoc;
  canvas: { width: number; height: number };
  ground: number;
}

/** The part of a state that drawing reads (a StateDef without its motion reference also fits). */
export type DrawState = Pick<StateDef, 'actors' | 'layers'>;

/** Numbers in output: rounded to 3 decimals, no "-0". */
export function n(v: number): string {
  if (!Number.isFinite(v)) throw new Error('mascot: non-finite number in frame');
  const r = Math.round(v * 1000) / 1000;
  return Object.is(r, -0) ? '0' : String(r);
}

type Colors = Record<string, string | null>;

function color(c: Colors, token: string | null | undefined): string | null {
  if (token == null) return null;
  const v = c[token];
  if (v === undefined) throw new Error(`mascot: unknown palette token "${token}"`);
  return v;
}

function tf(ops: TransformOp[] | undefined): string {
  if (!ops || !ops.length) return '';
  return ` transform="${ops.map(o => (o[0] === 'rotate' ? `rotate(${n(o[1])} ${n(o[2])} ${n(o[3])})` : `${o[0]}(${n(o[1])} ${n(o[2])})`)).join(' ')}"`;
}

function paintAttrs(c: Colors, p: Paint): string | null {
  const fill = color(c, p.fill), stroke = p.stroke != null ? color(c, p.stroke) : null;
  // A shape whose only colours are hidden tokens is not drawn at all.
  if (fill == null && stroke == null && (p.fill != null || p.stroke != null)) return null;
  let s = ` fill="${fill ?? 'none'}"`;
  if (stroke != null) {
    s += ` stroke="${stroke}" stroke-width="${n(p.strokeWidth ?? 1)}"`;
    if (p.cap && p.cap !== 'butt') s += ` stroke-linecap="${p.cap}"`;
    if (p.join && p.join !== 'miter') s += ` stroke-linejoin="${p.join}"`;
  }
  return s;
}

function prim(c: Colors, p: Prim, actors: string[]): string {
  if (p.type === 'group') return `<g${tf(p.transform)}>${p.children.map(ch => layer(c, ch, actors)).join('')}</g>`;
  const paint = paintAttrs(c, p);
  if (paint == null) return '';
  const t = tf(p.transform);
  switch (p.type) {
    case 'rect': return `<rect x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" rx="${n(p.rx)}" ry="${n(p.ry)}"${paint}${t}/>`;
    case 'circle': return `<circle cx="${n(p.cx)}" cy="${n(p.cy)}" r="${n(p.r)}"${paint}${t}/>`;
    case 'ellipse': return `<ellipse cx="${n(p.cx)}" cy="${n(p.cy)}" rx="${n(p.rx)}" ry="${n(p.ry)}"${paint}${t}/>`;
    case 'path': return `<path d="${p.d}"${paint}${t}/>`;
  }
}

function layer(c: Colors, l: Layer, actors: string[]): string {
  return l.type === 'actor' ? actors[l.actor] : prim(c, l, actors);
}

// ---------------- the character (body units, tile 64 by 54) ----------------
const TILE = 'M7 0H40A24 24 0 0 1 64 24V47A7 7 0 0 1 57 54H24A24 24 0 0 1 0 30V7A7 7 0 0 1 7 0Z';
const FOLD = 'M7 0H38L64 26V47A7 7 0 0 1 57 54H24A24 24 0 0 1 0 30V7A7 7 0 0 1 7 0Z';
const FOLD_CORNER = 'M38 0L64 26H62A24 24 0 0 0 38 2Z';

const stroke = (d: string, w: number, ink: string) =>
  `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;

export function eye(type: EyeType, x: number, y: number, blink: number, ink: string): string {
  switch (type) {
    case 'oval': return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="5.2" ry="${n(Math.max(1.9, 7 * blink))}" fill="${ink}"/>`;
    case 'big': return `<ellipse cx="${n(x)}" cy="${n(y - 1)}" rx="5.82" ry="${n(Math.max(1.9, 8.54 * blink))}" fill="${ink}"/>`;
    case 'small': return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="3.4" ry="${n(Math.max(1.9, 4.6 * blink))}" fill="${ink}"/>`;
    case 'lid': case 'slantL': case 'slantR': {
      const y0 = y - 0.7, rot = type === 'slantL' ? 14 : type === 'slantR' ? -14 : 0;
      return `<path d="M${n(x - 5.2)} ${n(y0)}A5.2 7 0 0 0 ${n(x + 5.2)} ${n(y0)}Z" fill="${ink}"${rot ? ` transform="rotate(${rot} ${n(x)} ${n(y)})"` : ''}/>`;
    }
    case 'arc': return stroke(`M${n(x - 5.5)} ${n(y + 2.4)}Q${n(x)} ${n(y - 5)} ${n(x + 5.5)} ${n(y + 2.4)}`, 3.8, ink);
    case 'cup': return stroke(`M${n(x - 5.5)} ${n(y - 1.6)}Q${n(x)} ${n(y + 4.6)} ${n(x + 5.5)} ${n(y - 1.6)}`, 3.8, ink);
    case 'line': return stroke(`M${n(x - 5.5)} ${n(y + 1)}L${n(x + 5.5)} ${n(y + 1)}`, 3.8, ink);
    case 'x': return stroke(`M${n(x - 4.5)} ${n(y - 4.5)}L${n(x + 4.5)} ${n(y + 4.5)}M${n(x + 4.5)} ${n(y - 4.5)}L${n(x - 4.5)} ${n(y + 4.5)}`, 3.6, ink);
    case 'none': return '';
  }
  return '';
}

export function mouth(type: MouthType, x: number, y: number, w: number, ink: string): string {
  const h = w / 2;
  switch (type) {
    case 'line': return stroke(`M${n(x - h)} ${n(y)}L${n(x + h)} ${n(y)}`, 3.4, ink);
    case 'curve': return stroke(`M${n(x - h)} ${n(y - 1)}Q${n(x)} ${n(y + 3.2)} ${n(x + h)} ${n(y - 1)}`, 3.4, ink);
    case 'big': return stroke(`M${n(x - h)} ${n(y - 1.6)}Q${n(x)} ${n(y + 4.6)} ${n(x + h)} ${n(y - 1.6)}`, 3.4, ink);
    case 'soft': return stroke(`M${n(x - h)} ${n(y + 1)}Q${n(x)} ${n(y - 1.6)} ${n(x + h)} ${n(y + 1)}`, 3.2, ink);
    case 'frown': return stroke(`M${n(x - h)} ${n(y + 1)}Q${n(x)} ${n(y - 2.6)} ${n(x + h)} ${n(y + 1)}`, 3.4, ink);
    case 'o': return `<circle cx="${n(x)}" cy="${n(y + 0.6)}" r="2.8" fill="none" stroke="${ink}" stroke-width="3"/>`;
    case 'smirk': return stroke(`M${n(x - h)} ${n(y)}Q${n(x + w / 4)} ${n(y + 2.4)} ${n(x + h)} ${n(y - 2)}`, 3.2, ink);
    case 'D': return `<path d="M${n(x - h)} ${n(y - 2)}L${n(x + h)} ${n(y - 2)}A${n(h)} ${n(h)} 0 0 1 ${n(x - h)} ${n(y - 2)}Z" fill="${ink}"/>`;
    case 'wavy': {
      const x0 = x - h;
      return stroke(`M${n(x0)} ${n(y)}Q${n(x0 + w / 6)} ${n(y - 2.4)} ${n(x0 + w / 3)} ${n(y)}Q${n(x)} ${n(y + 2.4)} ${n(x0 + 2 * w / 3)} ${n(y)}Q${n(x + w / 3)} ${n(y - 2.4)} ${n(x + h)} ${n(y)}`, 3, ink);
    }
    case 'none': return '';
  }
  return '';
}

function crossfade(cur: string, prev: string | null | undefined, fade: number | undefined, draw: (t: string) => string): string {
  if (prev != null && fade != null && fade <= 0) return draw(prev);
  if (prev != null && fade != null && fade < 1) return `<g opacity="${n(1 - fade)}">${draw(prev)}</g><g opacity="${n(fade)}">${draw(cur)}</g>`;
  return draw(cur);
}

function arm(p: Pose, side: 'L' | 'R', fill: string): string {
  const a = side === 'L' ? p.aL : p.aR;
  if (!(a > 0.02)) return '';
  const ax = side === 'L' ? p.aLx : p.aRx, ay = side === 'L' ? p.aLy : p.aRy;
  const ang = side === 'L' ? p.aLang : p.aRang, len = (side === 'L' ? p.aLlen : p.aRlen) * a;
  const thumb = (side === 'L' ? p.aLthumb : p.aRthumb) >= 0.5;
  let s = `<rect x="${n(ax - 4.5)}" y="${n(ay - len)}" width="9" height="${n(len + 4.5)}" rx="4.5" ry="${n(Math.min(4.5, (len + 4.5) / 2))}" fill="${fill}" transform="rotate(${n(ang)} ${n(ax)} ${n(ay)})"/>`;
  if (thumb) {
    const q = ang * Math.PI / 180, tx = ax + len * Math.sin(q), ty = ay - len * Math.cos(q);
    s += `<rect x="${n(tx - 4.5)}" y="${n(ty - 14)}" width="9" height="14" rx="4.5" ry="4.5" fill="${fill}"/>`;
  }
  return s;
}

function foot(p: Pose, side: 'L' | 'R', fill: string): string {
  const lift = side === 'L' ? p.footL : p.footR, rot = side === 'L' ? p.footLRot : p.footRRot;
  const x = side === 'L' ? 13 : 40, px = side === 'L' ? 18.5 : 45.5;
  const t = rot ? ` transform="rotate(${n(rot)} ${px} ${n(50 - lift)})"` : '';
  return `<rect x="${x}" y="${n(48 - lift)}" width="11" height="13" rx="5.5" ry="5.5" fill="${fill}"${t}/>`;
}

export function character(c: Colors, p: Pose): string {
  const body = color(c, 'body')!, feet = color(c, 'feet')!, armC = color(c, 'arm')!, ink = color(c, 'navy')!;
  let s = foot(p, 'L', feet) + foot(p, 'R', feet) + arm(p, 'L', armC) + arm(p, 'R', armC);
  s += p.fold >= 0.5 ? `<path d="${FOLD}" fill="${body}"/><path d="${FOLD_CORNER}" fill="${ink}"/>` : `<path d="${TILE}" fill="${body}"/>`;
  const ex = 13, ey = 25;
  s += crossfade(p.eyeL, p.eyeLPrev, p.eyeLFade, t => eye(t as EyeType, 32 - ex + p.edx, ey + p.edy, p.blink, ink));
  s += crossfade(p.eyeR, p.eyeRPrev, p.eyeRFade, t => eye(t as EyeType, 32 + ex + p.edx, ey + p.edy, p.blink, ink));
  s += crossfade(p.mouth, p.mouthPrev, p.mouthFade, t => mouth(t as MouthType, 32 + p.mdx, 38 + p.mdy, p.mw, ink));
  if (p.badge >= 0.5) s += `<rect x="25" y="-3" width="14" height="9" rx="3.5" ry="3.5" fill="${ink}"/>`;
  return s;
}

function actorSvg(c: Colors, ground: number, state: DrawState, i: number, p: Pose): string {
  const a = state.actors[i], s = a.s;
  let out = '';
  const shadow = color(c, 'shadow');
  if (a.shadow && shadow != null) {
    const lift = Math.max(0, -p.y), k = p.shadow ?? 1;
    out += `<ellipse cx="${n(a.cx + p.x * s)}" cy="${n(ground + 6.5 * s)}" rx="${n(27 * s * p.sx * k / (1 + lift / 30))}" ry="${n(3.4 * s * k)}" fill="${shadow}"/>`;
  }
  out += `<g transform="translate(${n(a.cx - 32 * s + p.x * s)} ${n(a.by - 54 * s + p.y * s)}) scale(${n(s)})">`
    + `<g transform="rotate(${n(p.tilt)} 32 27) translate(32 54) scale(${n(p.sx)} ${n(p.sy)}) translate(-32 -54)">`
    + character(c, p) + '</g></g>';
  return out;
}

export interface DrawOptions {
  surface?: Surface;
  /** Width and height attributes in px (the viewBox is always the 240 by 240 canvas). Omit for none. */
  size?: number;
  /** A palette token or a CSS colour painted behind the scene. Omit for transparent. */
  background?: string;
  /** Extra attributes for the root <svg>, already escaped. */
  attrs?: string;
}

export function drawSceneWith(spec: DrawSpec, state: DrawState, poses: Pose[], opts: DrawOptions = {}): string {
  const c = spec.palette.surfaces[opts.surface ?? 'light'];
  if (!c) throw new Error(`mascot: unknown surface "${opts.surface}"`);
  const { width: W, height: H } = spec.canvas;
  const actors = poses.map((p, i) => actorSvg(c, spec.ground, state, i, p));
  const size = opts.size != null ? ` width="${n(opts.size)}" height="${n(opts.size)}"` : '';
  let bg = '';
  if (opts.background) {
    const v = opts.background in c ? c[opts.background] : opts.background;
    if (v) bg = `<rect width="${W}" height="${H}" fill="${v}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"${size}${opts.attrs ?? ''}>${bg}${state.layers.map(l => layer(c, l, actors)).join('')}</svg>`;
}

/**
 * Draws a prop on its own (no Buddy, no ground shadow) in its box. Props differ in shape (a keyboard is
 * long, a microphone small), so `size` sets the area, not a side: the prop covers about size by size
 * px, and neither side exceeds 1.5 times size. Width and height follow the box's proportions.
 */
export function drawPropWith(spec: DrawSpec, prop: Pick<PropDef, 'box' | 'layers'>, opts: Pick<DrawOptions, 'surface' | 'size'> = {}): string {
  const c = spec.palette.surfaces[opts.surface ?? 'light'];
  if (!c) throw new Error(`mascot: unknown surface "${opts.surface}"`);
  const [x, y, w, h] = prop.box;
  let size = '';
  if (opts.size != null) {
    const k = Math.min(opts.size / Math.sqrt(w * h), 1.5 * opts.size / w, 1.5 * opts.size / h);
    size = ` width="${n(Math.round(w * k))}" height="${n(Math.round(h * k))}"`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(x)} ${n(y)} ${n(w)} ${n(h)}"${size}>${prop.layers.map(l => prim(c, l, [])).join('')}</svg>`;
}
