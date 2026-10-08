export type * from './types.js';
export { SPEC } from './spec-data.js';
export { renderFrameSvg, type FrameInfo, type RenderOptions } from './render.js';
export { createPlayer, type Player, type PlayerOptions } from './player.js';
export { resolvePoses, sampleClip, locate, mixDiscrete, applySample, restPose, getState, clipFor, type Phase } from './pose.js';
export { drawScene, type DrawOptions } from './svg.js';
export { mulberry32 } from './rng.js';
/** All state keys, in board order. */
export declare const STATE_KEYS: readonly string[];
