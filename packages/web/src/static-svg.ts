// The static entry, without React: the resting pose of a state as an SVG string. Pure and server-safe.
// It reads only the states-only data (static-data.ts) and draw.ts: no player, sampler, rng or motion clip.
// The output is byte-identical to the resting frame of the animated player (renderFrameSvg(key)).
import type { StaticStateDef, Surface } from './types.js';
import { STATIC_SPEC } from './static-data.js';
import { drawSceneWith, type DrawSpec } from './draw.js';
import { restPose } from './rest.js';

export type { Surface } from './types.js';

export interface RestSvgOptions {
  /** `light` (default) or `dark` (no ground shadow). */
  surface?: Surface;
  /** Width and height attributes in px. Omit for none (the viewBox is always the 240 by 240 canvas). */
  size?: number;
}

export interface StateInfo {
  /** The state key, for example `no-events`. */
  readonly key: string;
  /** The board group, for example `Welcome`. */
  readonly group: string;
  /** The human name, for example `No events yet`. */
  readonly name: string;
  /** Where to use it, for example `First open, sign-in, greetings`. */
  readonly use: string;
}

const DRAW: DrawSpec = { palette: STATIC_SPEC.palette, canvas: STATIC_SPEC.canvas, ground: STATIC_SPEC.ground };

/** All state keys, in board order. */
export const STATE_KEYS: readonly string[] = STATIC_SPEC.states.map(s => s.key);

/** Key, group, name and use note of every state, in board order. */
export const STATE_INFO: readonly StateInfo[] = STATIC_SPEC.states.map(({ key, group, name, use }) => ({ key, group, name, use }));

/** The state definition for `key`; throws for an unknown key. */
export function getStaticState(key: string): StaticStateDef {
  const st = STATIC_SPEC.states.find(s => s.key === key);
  if (!st) throw new Error(`Unknown mascot state "${key}"`);
  return st;
}

/** Pure: the SVG of the state's resting pose. The same input always gives the same string. */
export function renderRestSvg(stateKey: string, opts: RestSvgOptions = {}): string {
  const st = getStaticState(stateKey);
  return drawSceneWith(DRAW, st, st.actors.map(a => restPose(a.rest)), { surface: opts.surface, size: opts.size });
}

/**
 * The resting pose as a `data:` URI, for `<img src>`, CSS `url()` and email clients that take it.
 * Percent-encoded, with quotes and parentheses escaped so it is safe inside any attribute or `url(...)`.
 */
export function restSvgDataUri(stateKey: string, opts: RestSvgOptions = {}): string {
  const enc = encodeURIComponent(renderRestSvg(stateKey, opts)).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  return 'data:image/svg+xml;charset=utf-8,' + enc;
}
