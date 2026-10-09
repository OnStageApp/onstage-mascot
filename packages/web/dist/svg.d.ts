import type { Pose, StateDef } from './types.js';
import { type DrawOptions } from './draw.js';
export { n, eye, mouth, character, type DrawOptions } from './draw.js';
export declare function drawScene(state: StateDef, poses: Pose[], opts?: DrawOptions): string;
