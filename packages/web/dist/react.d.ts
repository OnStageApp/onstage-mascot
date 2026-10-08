import { type CSSProperties } from 'react';
import type { Surface } from './types.js';
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
}
export declare function Buddy({ state, surface, size, playOnMount, onDone, reducedMotion, label, className, style }: BuddyProps): import("react").JSX.Element;
