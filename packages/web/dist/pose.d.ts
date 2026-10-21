import type { Clip, Pose, StateDef, EyeType, MouthType } from './types.js';
import { restPose } from './rest.js';
export type Phase = 'rest' | 'motion' | 'idle';
export declare function locate(clip: Clip, t: number): {
    i0: number;
    i1: number;
    a: number;
};
export declare function mixDiscrete(t0: number, p0: number, f0: number, t1: number, p1: number, f1: number, a: number): [number, number, number];
type Sample = Record<string, number | string | null>;
/** The clip's values at time t (seconds): numbers by field, discrete tracks as names plus prev and fade. */
export declare function sampleClip(clip: Clip, t: number): Sample;
export { restPose };
/** Rest pose combined with a clip sample: absolute clips replace fields, additive clips offset them. */
export declare function applySample(rest: Pose, clip: Clip, s: Sample): Pose;
/** Offsets a pose in place by an additive clip sample (contract section 8) and returns it. */
export declare function addSample(pose: Pose, s: Sample): Pose;
/** A clip that can be played on top of any pose (player.playClip), or an error. */
export declare function getOverlayClip(id: string): Clip;
/** The ids of the one-shot additive clips playClip accepts, in spec order. */
export declare function overlayClipIds(): string[];
export declare function getState(key: string): StateDef;
/** The clip a phase plays for a state, or null for the rest phase. */
export declare function clipFor(state: StateDef, phase: Phase): Clip | null;
/** An additive clip played on top of the phase's poses, at time t into the clip (see player.playClip). */
export interface Overlay {
    clip: Clip;
    t: number;
}
/** Every actor's pose at time t of a phase. blink: per-actor factor on eye height (1 = open).
 *  overlay: an additive clip applied to every actor after the phase's own clip. */
export declare function resolvePoses(state: StateDef, phase: Phase, t: number, blink?: readonly number[], overlay?: Overlay | null): Pose[];
export type { EyeType, MouthType };
