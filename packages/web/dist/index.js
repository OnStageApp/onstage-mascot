export { SPEC } from './spec-data.js';
export { renderFrameSvg } from './render.js';
export { createPlayer } from './player.js';
export { resolvePoses, sampleClip, locate, mixDiscrete, applySample, restPose, getState, clipFor } from './pose.js';
export { drawScene } from './svg.js';
export { mulberry32 } from './rng.js';
import { SPEC } from './spec-data.js';
/** All state keys, in board order. */
export const STATE_KEYS = SPEC.states.states.map(s => s.key);
