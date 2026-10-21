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
    /** Extra clips played now and then while idling, scheduled like blinks (off under reduced motion). */
    ambient?: AmbientOptions | null;
}
/** Options for {@link Player.playClip}. */
export interface PlayClipOptions {
    /** What follows the clip: "idle" (default) starts idle if the player was at rest; null leaves the phase as it is. */
    then?: 'idle' | null;
    /** Called when the clip ends, or right away (asynchronously) under reduced motion. Not called when
     *  another playClip, play(), setState() or destroy() cuts the clip short. */
    onDone?: () => void;
}
/** Random extra clips while idling: after each gap of gapMin..gapMax seconds of idle, one of `clips`. */
export interface AmbientOptions {
    /** Ids of one-shot additive clips, for example ["hop", "glance-left", "glance-right"]. */
    clips: readonly string[];
    /** Shortest gap between two clips in seconds (default 6). */
    gapMin?: number;
    /** Longest gap in seconds (default 10). */
    gapMax?: number;
    /** Random source in [0, 1) (default Math.random). Separate from the blink source, so blinks keep their schedule. */
    random?: () => number;
}
export interface Player {
    readonly stateKey: string;
    readonly phase: Phase;
    /** Seconds into the current phase. */
    readonly time: number;
    /** Restart the current state's motion. */
    play(): void;
    /** Play a one-shot additive clip (hop, glance-left, glance-right, look-around) on top of what is
     *  showing, then carry on. A clip already playing is replaced. Does nothing under reduced motion. */
    playClip(id: string, opts?: PlayClipOptions): void;
    /** The additive clip playing on top, or null. */
    readonly clip: string | null;
    /** Change or turn off (null) the ambient clips. */
    setAmbient(ambient: AmbientOptions | null): void;
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
