import { clipFor, getOverlayClip, getState, resolvePoses } from './pose.js';
import { drawScene } from './svg.js';
/** Pure: the SVG for one frame of a state. Safe on the server; the same input always gives the same string. */
export function renderFrameSvg(stateKey, frame = {}, opts = {}) {
    const state = getState(stateKey);
    const phase = frame.phase ?? 'rest';
    const clip = clipFor(state, phase);
    const t = frame.t ?? (frame.frame != null && clip ? frame.frame / clip.fps : 0);
    const overlay = frame.overlay ? { clip: getOverlayClip(frame.overlay.clip), t: frame.overlay.t } : null;
    return drawScene(state, resolvePoses(state, phase, t, frame.blink, overlay), opts);
}
