import { STATIC_SPEC } from './static-data.js';
import { drawSceneWith } from './draw.js';
import { restPose } from './rest.js';
const DRAW = { palette: STATIC_SPEC.palette, canvas: STATIC_SPEC.canvas, ground: STATIC_SPEC.ground };
/** All state keys, in board order. */
export const STATE_KEYS = STATIC_SPEC.states.map(s => s.key);
/** Key, group, name and use note of every state, in board order. */
export const STATE_INFO = STATIC_SPEC.states.map(({ key, group, name, use }) => ({ key, group, name, use }));
/** The state definition for `key`; throws for an unknown key. */
export function getStaticState(key) {
    const st = STATIC_SPEC.states.find(s => s.key === key);
    if (!st)
        throw new Error(`Unknown mascot state "${key}"`);
    return st;
}
/** Pure: the SVG of the state's resting pose. The same input always gives the same string. */
export function renderRestSvg(stateKey, opts = {}) {
    const st = getStaticState(stateKey);
    return drawSceneWith(DRAW, st, st.actors.map(a => restPose(a.rest)), { surface: opts.surface, size: opts.size });
}
/**
 * The resting pose as a `data:` URI, for `<img src>`, CSS `url()` and email clients that take it.
 * Percent-encoded, with quotes and parentheses escaped so it is safe inside any attribute or `url(...)`.
 */
export function restSvgDataUri(stateKey, opts = {}) {
    const enc = encodeURIComponent(renderRestSvg(stateKey, opts)).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
    return 'data:image/svg+xml;charset=utf-8,' + enc;
}
