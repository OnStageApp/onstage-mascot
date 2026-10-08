import type { CSSProperties } from 'react';
import type { Surface } from './types.js';
export interface BuddyStaticProps {
    /** A state key from spec/states.json, for example "hello" or "no-events". */
    state: string;
    surface?: Surface;
    /** Width and height in px (default 160). */
    size?: number;
    /** Accessible name; defaults to the state's name. Pass "" to hide from assistive tech. */
    title?: string;
    /** Purely decorative: adds aria-hidden, so assistive tech skips it. */
    decorative?: boolean;
    className?: string;
    style?: CSSProperties;
}
export declare function BuddyStatic({ state, surface, size, title, decorative, className, style }: BuddyStaticProps): import("react").JSX.Element;
