import type { Surface } from './types.js';
import { type Phase } from './pose.js';
export interface PlayerOptions {
    state: string;
    surface?: Surface;
    /** Width and height of the <svg> in px. */
    size?: number;
    /** A palette token or CSS colour behind the scene; omit for transparent. */
    background?: string;
    /** Extra attributes for the root <svg>, already escaped. */
    attrs?: string;
    /** Element whose innerHTML receives each frame. */
    target?: {
        innerHTML: string;
    } | null;
    /** Called with each new frame. */
    onFrame?: (svg: string) => void;
    /** Play the state's motion on start (default true). When false, start straight in idle. */
    playOnMount?: boolean;
    /** Resting pose only: no motion, no idle, no blinks (default false). */
    reducedMotion?: boolean;
    /** Called when a once-motion finishes (also, right away, under reduced motion). */
    onDone?: () => void;
    /** Random source in [0, 1) for blinks (default Math.random). */
    random?: () => number;
    /** Run an animation-frame loop (default true when requestAnimationFrame exists). False: drive with advance(). */
    autoStart?: boolean;
    /** Stop the loop while the document is hidden (default true). */
    pauseWhenHidden?: boolean;
    requestFrame?: (cb: (ms: number) => void) => unknown;
    cancelFrame?: (handle: unknown) => void;
}
export interface Player {
    readonly stateKey: string;
    readonly phase: Phase;
    /** Seconds into the current phase. */
    readonly time: number;
    /** Restart the current state's motion. */
    play(): void;
    setState(key: string, opts?: {
        play?: boolean;
    }): void;
    setSurface(surface: Surface): void;
    setReducedMotion(on: boolean): void;
    /** Advance the clock by dt seconds (clamped to 0..0.1) and render. */
    advance(dt: number): void;
    pause(): void;
    resume(): void;
    destroy(): void;
    /** The current frame. */
    svg(): string;
}
export declare function createPlayer(opts: PlayerOptions): Player;
