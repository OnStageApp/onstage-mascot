import { type CSSProperties, type Ref } from 'react';
import type { Surface } from './types.js';
import { type AmbientOptions, type PlayClipOptions } from './player.js';
/** What a ref on <Buddy> gives you (React 19, where ref is a prop). */
export interface BuddyHandle {
    /** Restart the state's motion. */
    play(): void;
    /** Play a one-shot additive clip (hop, glance-left, glance-right, look-around) on top, then carry on. */
    playClip(id: string, opts?: PlayClipOptions): void;
}
export interface BuddyProps {
    /** A state key from spec/states.json, for example "hello" or "no-events". */
    state: string;
    surface?: Surface;
    /** Width and height in px (default 160). */
    size?: number;
    /** Play the state's motion when it mounts or the state changes (default true). Otherwise start in idle. */
    playOnMount?: boolean;
    /** Called when a once-motion finishes. */
    onDone?: () => void;
    /** Force reduced motion on or off; undefined follows prefers-reduced-motion. */
    reducedMotion?: boolean;
    /** Accessible label; defaults to the state's name. Pass "" to hide from assistive tech. */
    label?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra clips played now and then while idling, for example { clips: ['hop', 'glance-left', 'glance-right'] }.
     *  Off under reduced motion. */
    ambient?: AmbientOptions | null;
    /** Receives { play, playClip } (React 19). */
    ref?: Ref<BuddyHandle>;
}
export declare function Buddy({ state, surface, size, playOnMount, onDone, reducedMotion, label, className, style, ambient, ref: handle }: BuddyProps): import("react").JSX.Element;
