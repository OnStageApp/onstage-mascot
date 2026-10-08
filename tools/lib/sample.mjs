// Reference implementation of clip sampling (docs/renderer-contract.md, "Sampling a clip").
// The web package has its own TypeScript copy; tests check both against the 60 fps rig.

export function locate(clip, t) {
  const n = clip.frames, fps = clip.fps;
  if (!clip.loop) {
    const u = Math.min(Math.max(t * fps, 0), n - 1), i0 = Math.floor(u);
    return { i0, i1: Math.min(i0 + 1, n - 1), a: u - i0 };
  }
  const intro = clip.introFrames, L = n - intro, u = Math.max(0, t * fps);
  if (u < intro) { const i0 = Math.floor(u); return { i0, i1: i0 + 1, a: u - i0 }; }
  const v = (u - intro) % L, j0 = Math.floor(v);
  return { i0: intro + j0, i1: intro + ((j0 + 1) % L), a: v - j0 };
}

export function mixDiscrete(t0, p0, f0, t1, p1, f1, a) {
  if (a <= 0) return [t0, p0, f0];
  if (t0 === t1 && p0 === p1) return [t0, p0, f0 + (f1 - f0) * a];
  if (p1 === t0) return [t1, p1, f1 * a]; // the switch happened between the two samples
  return a < 0.5 ? [t0, p0, f0] : [t1, p1, f1];
}

const TRACKS = [['eyeL', 'eyeTypes'], ['eyeR', 'eyeTypes'], ['mouth', 'mouthTypes']];

// Returns the clip's values at time t: numbers by field name, discrete tracks as names with prev and fade.
export function sample(clip, t) {
  const { i0, i1, a } = locate(clip, t);
  const r0 = clip.rows[i0], r1 = clip.rows[i1], out = { ...clip.constants };
  const col = {};
  clip.fields.forEach((f, i) => { col[f] = i; });
  for (const f of clip.fields) {
    if (/^(eyeL|eyeR|mouth)(Prev|Fade)?$/.test(f)) continue;
    out[f] = r0[col[f]] + (r1[col[f]] - r0[col[f]]) * a;
  }
  for (const [tr, table] of TRACKS) {
    if (!(tr in col) && !(tr in clip.constants)) continue;
    const get = (r, k) => (k in col ? r[col[k]] : clip.constants[k]);
    const [ty, pv, fd] = mixDiscrete(get(r0, tr), get(r0, tr + 'Prev'), get(r0, tr + 'Fade'), get(r1, tr), get(r1, tr + 'Prev'), get(r1, tr + 'Fade'), a);
    out[tr] = clip[table][ty]; out[tr + 'Prev'] = pv < 0 ? null : clip[table][pv]; out[tr + 'Fade'] = fd;
  }
  return out;
}
