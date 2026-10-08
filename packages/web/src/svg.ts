// Draws a resolved scene as an SVG string. Pure and deterministic: the same input gives the same string.
// The drawing itself lives in draw.ts (no data import); this file binds it to the full spec.
import type { Pose, StateDef } from './types.js';
import { SPEC } from './spec-data.js';
import { drawSceneWith, type DrawOptions } from './draw.js';

export { n, eye, mouth, character, type DrawOptions } from './draw.js';

export function drawScene(state: StateDef, poses: Pose[], opts: DrawOptions = {}): string {
  return drawSceneWith({ palette: SPEC.palette, canvas: SPEC.states.canvas, ground: SPEC.states.ground }, state, poses, opts);
}
