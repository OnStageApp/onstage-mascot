// The character pose vocabulary shared by the importer, the motion sources and the baker.
// Units: body units (the logo tile is 64 by 54) unless noted. docs/renderer-contract.md is the reference.

export const EYE_TYPES = ['oval', 'big', 'small', 'lid', 'slantL', 'slantR', 'arc', 'cup', 'line', 'x', 'none'];
export const MOUTH_TYPES = ['curve', 'line', 'big', 'soft', 'frown', 'o', 'smirk', 'D', 'wavy', 'none'];

// Numeric pose fields in their fixed order (the order motion headers use when a clip carries them all).
export const NUM_FIELDS = [
  'x', 'y', 'tilt', 'sx', 'sy',
  'edx', 'edy', 'blink',
  'mw', 'mdx', 'mdy',
  'footL', 'footR', 'footLRot', 'footRRot',
  'aL', 'aLx', 'aLy', 'aLang', 'aLlen', 'aLthumb',
  'aR', 'aRx', 'aRy', 'aRang', 'aRlen', 'aRthumb',
];
export const DISCRETE = ['eyeL', 'eyeR', 'mouth'];
export const STATIC_FIELDS = ['fold', 'badge'];

export const ARM_DEFAULT = { L: { x: 3, y: 27, ang: 0, len: 22 }, R: { x: 61, y: 27, ang: 0, len: 22 } };

export function neutralPose() {
  return {
    x: 0, y: 0, tilt: 0, sx: 1, sy: 1,
    eyeL: 'oval', eyeR: 'oval', edx: 0, edy: 0, blink: 1,
    mouth: 'curve', mw: 7, mdx: 0, mdy: 0,
    footL: 0, footR: 0, footLRot: 0, footRRot: 0,
    aL: 0, aLx: 3, aLy: 27, aLang: 0, aLlen: 22, aLthumb: 0,
    aR: 0, aRx: 61, aRy: 27, aRang: 0, aRlen: 22, aRthumb: 0,
    fold: 0, badge: 0,
  };
}

// Mouth widths the engine (buddy-anim) draws at; it has no width field of its own.
export const ENGINE_MOUTH_W = { curve: 7, line: 7, big: 9, frown: 7, wavy: 12, o: 7 };

// Engine pose (canvas units at scale 3, arms as angles) -> our pose, on top of `rest`.
// Mouth width: keep the rest width while the mouth type equals the rest mouth, so it never pops.
export function fromEngine(p, rest, { mirrorTilt = false } = {}) {
  const et = Array.isArray(p.eyes) ? p.eyes : [p.eyes, p.eyes];
  const out = { ...rest };
  out.x = (p.x || 0) / 3; out.y = (p.y || 0) / 3;
  out.tilt = (mirrorTilt ? -1 : 1) * (p.tilt || 0);
  out.sx = p.sx ?? 1; out.sy = p.sy ?? 1;
  out.eyeL = et[0]; out.eyeR = et[1];
  out.edx = p.edx || 0; out.edy = p.edy || 0; out.blink = p.blink ?? 1;
  out.mouth = p.mouth;
  out.mw = p.mouth === rest.mouth ? rest.mw : (ENGINE_MOUTH_W[p.mouth] ?? 7);
  out.mdx = p.mdx || 0; out.mdy = 0;
  out.footL = p.footL || 0; out.footR = p.footR || 0; out.footLRot = 0; out.footRRot = 0;
  for (const s of ['L', 'R']) {
    const a = p['arm' + s];
    if (a == null) { out['a' + s] = 0; continue; }
    Object.assign(out, { ['a' + s]: 1, ['a' + s + 'x']: ARM_DEFAULT[s].x, ['a' + s + 'y']: ARM_DEFAULT[s].y, ['a' + s + 'ang']: a, ['a' + s + 'len']: ARM_DEFAULT[s].len, ['a' + s + 'thumb']: 0 });
  }
  return out;
}
