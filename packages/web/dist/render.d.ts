import type { Surface } from './types.js';
import { type Phase } from './pose.js';
export interface FrameInfo {
    /** "rest" (default), "motion" (the state's own clip, looping for loop states) or "idle". */
    phase?: Phase;
    /** Seconds into the phase. */
    t?: number;
    /** Alternative to t: a frame index (fractional allowed) at the clip's fps (30). */
    frame?: number;
    /** Per-actor blink factor, 1 = open. */
    blink?: readonly number[];
}
export interface RenderOptions {
    surface?: Surface;
    size?: number;
    background?: string;
    /** Extra attributes for the root <svg>, already escaped (for example ` role="img"`). */
    attrs?: string;
}
/** Pure: the SVG for one frame of a state. Safe on the server; the same input always gives the same string. */
export declare function renderFrameSvg(stateKey: string, frame?: FrameInfo, opts?: RenderOptions): string;
