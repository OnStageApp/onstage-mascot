// Frame resolution: which pose each actor has at a given phase and time.
// Follows docs/renderer-contract.md sections "Sampling a clip" and "Phases".
import type { Clip, Pose, StateDef, EyeType, MouthType } from './types.js';
import { SPEC } from './spec-data.js';
import { restPose } from './rest.js';

export type Phase = 'rest' | 'motion' | 'idle';

const ADD = new Set(['x', 'y', 'tilt', 'edx', 'edy', 'mdx', 'mdy', 'footL', 'footR', 'footLRot', 'footRRot', 'aLang', 'aRang']);
const MUL = new Set(['sx', 'sy', 'blink', 'shadow']);
/** Multiplied fields a rest pose may lack, and their neutral value. */
const MUL_DEFAULT: Record<string, number> = { shadow: 1 };
const DISCRETE_RE = /^(eyeL|eyeR|mouth)(Prev|Fade)?$/;

export function locate(clip: Clip, t: number): { i0: number; i1: number; a: number } {
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

export function mixDiscrete(t0: number, p0: number, f0: number, t1: number, p1: number, f1: number, a: number): [number, number, number] {
  if (a <= 0) return [t0, p0, f0];
  if (t0 === t1 && p0 === p1) return [t0, p0, f0 + (f1 - f0) * a];
  if (p1 === t0) return [t1, p1, f1 * a];
  return a < 0.5 ? [t0, p0, f0] : [t1, p1, f1];
}

type Sample = Record<string, number | string | null>;

const colCache = new WeakMap<Clip, Record<string, number>>();
function columns(clip: Clip): Record<string, number> {
  let c = colCache.get(clip);
  if (!c) { c = {}; clip.fields.forEach((f, i) => { c![f] = i; }); colCache.set(clip, c); }
  return c;
}

/** The clip's values at time t (seconds): numbers by field, discrete tracks as names plus prev and fade. */
export function sampleClip(clip: Clip, t: number): Sample {
  const { i0, i1, a } = locate(clip, t);
  const r0 = clip.rows[i0], r1 = clip.rows[i1], col = columns(clip);
  const out: Sample = { ...clip.constants };
  for (const f of clip.fields) {
    if (DISCRETE_RE.test(f)) continue;
    const k = col[f];
    out[f] = r0[k] + (r1[k] - r0[k]) * a;
  }
  for (const [tr, table] of [['eyeL', clip.eyeTypes], ['eyeR', clip.eyeTypes], ['mouth', clip.mouthTypes]] as const) {
    if (!(tr in col) && !(tr in clip.constants)) continue;
    const get = (r: number[], k: string) => (k in col ? r[col[k]] : clip.constants[k]);
    const [ty, pv, fd] = mixDiscrete(get(r0, tr), get(r0, tr + 'Prev'), get(r0, tr + 'Fade'), get(r1, tr), get(r1, tr + 'Prev'), get(r1, tr + 'Fade'), a);
    out[tr] = table![ty]; out[tr + 'Prev'] = pv < 0 ? null : table![pv]; out[tr + 'Fade'] = fd;
  }
  return out;
}

export { restPose };

/** Rest pose combined with a clip sample: absolute clips replace fields, additive clips offset them. */
export function applySample(rest: Pose, clip: Clip, s: Sample): Pose {
  const p = restPose(rest);
  if (clip.kind === 'absolute') {
    const r = p as unknown as Record<string, unknown>;
    for (const k in s) r[k] = s[k];
    return p;
  }
  return addSample(p, s);
}

/** Offsets a pose in place by an additive clip sample (contract section 8) and returns it. */
export function addSample(pose: Pose, s: Sample): Pose {
  const p = pose as unknown as Record<string, number>;
  for (const k in s) {
    const v = s[k] as number;
    if (ADD.has(k)) p[k] = p[k] + v;
    else if (MUL.has(k)) p[k] = (p[k] ?? MUL_DEFAULT[k] ?? 1) * v;
  }
  return pose;
}

/** A clip that can be played on top of any pose (player.playClip), or an error. */
export function getOverlayClip(id: string): Clip {
  const clip = SPEC.motion[id];
  if (!clip) throw new Error(`Unknown mascot clip "${id}"`);
  if (clip.kind !== 'additive' || clip.loop) throw new Error(`Mascot clip "${id}" is not a one-shot additive clip`);
  return clip;
}

/** The ids of the one-shot additive clips playClip accepts, in spec order. */
export function overlayClipIds(): string[] {
  return Object.keys(SPEC.motion).filter(id => SPEC.motion[id].kind === 'additive' && !SPEC.motion[id].loop && id !== SPEC.states.blink.motion);
}

export function getState(key: string): StateDef {
  const st = SPEC.states.states.find(s => s.key === key);
  if (!st) throw new Error(`Unknown mascot state "${key}"`);
  return st;
}

/** The clip a phase plays for a state, or null for the rest phase. */
export function clipFor(state: StateDef, phase: Phase): Clip | null {
  if (phase === 'motion') return SPEC.motion[state.motion.id] ?? null;
  if (phase === 'idle') return SPEC.motion[SPEC.states.idle.motion] ?? null;
  return null;
}

/** An additive clip played on top of the phase's poses, at time t into the clip (see player.playClip). */
export interface Overlay { clip: Clip; t: number }

/** Every actor's pose at time t of a phase. blink: per-actor factor on eye height (1 = open).
 *  overlay: an additive clip applied to every actor after the phase's own clip. */
export function resolvePoses(state: StateDef, phase: Phase, t: number, blink?: readonly number[], overlay?: Overlay | null): Pose[] {
  const extra = overlay ? sampleClip(overlay.clip, overlay.t) : null;
  const clip = clipFor(state, phase);
  return state.actors.map((actor, i) => {
    let pose = restPose(actor.rest);
    if (clip && phase === 'motion') {
      const ref = state.motion.actors.find(a => a.actor === i);
      const local = ref ? t - ref.offset : -1;
      if (ref && local >= 0) pose = applySample(actor.rest, clip, sampleClip(clip, local));
    } else if (clip && phase === 'idle') {
      pose = applySample(actor.rest, clip, sampleClip(clip, t + i * SPEC.states.idle.actorOffset));
    }
    if (extra) addSample(pose, extra);
    const b = blink?.[i];
    if (b != null && b !== 1) pose.blink *= b;
    return pose;
  });
}

export type { EyeType, MouthType };
