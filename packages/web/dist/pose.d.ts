import type { Clip, Pose, StateDef, EyeType, MouthType } from './types.js';
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
export declare function restPose(p: Pose): Pose;
/** Rest pose combined with a clip sample: absolute clips replace fields, additive clips offset them. */
export declare function applySample(rest: Pose, clip: Clip, s: Sample): Pose;
export declare function getState(key: string): StateDef;
/** The clip a phase plays for a state, or null for the rest phase. */
export declare function clipFor(state: StateDef, phase: Phase): Clip | null;
/** Every actor's pose at time t of a phase. blink: per-actor factor on eye height (1 = open). */
export declare function resolvePoses(state: StateDef, phase: Phase, t: number, blink?: readonly number[]): Pose[];
export type { EyeType, MouthType };
