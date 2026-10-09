import { SPEC } from './spec-data.js';
import { drawSceneWith } from './draw.js';
export { n, eye, mouth, character } from './draw.js';
export function drawScene(state, poses, opts = {}) {
    return drawSceneWith({ palette: SPEC.palette, canvas: SPEC.states.canvas, ground: SPEC.states.ground }, state, poses, opts);
}
