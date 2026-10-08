import type { StaticStateDef, Surface } from './types.js';
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
/** All state keys, in board order. */
export declare const STATE_KEYS: readonly string[];
/** Key, group, name and use note of every state, in board order. */
export declare const STATE_INFO: readonly StateInfo[];
/** The state definition for `key`; throws for an unknown key. */
export declare function getStaticState(key: string): StaticStateDef;
/** Pure: the SVG of the state's resting pose. The same input always gives the same string. */
export declare function renderRestSvg(stateKey: string, opts?: RestSvgOptions): string;
/**
 * The resting pose as a `data:` URI, for `<img src>`, CSS `url()` and email clients that take it.
 * Percent-encoded, with quotes and parentheses escaped so it is safe inside any attribute or `url(...)`.
 */
export declare function restSvgDataUri(stateKey: string, opts?: RestSvgOptions): string;
