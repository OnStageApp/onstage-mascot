import type { CSSProperties } from 'react';
import type { MascotProp, Surface } from './types.js';
export interface PropStaticProps {
    /** A prop key from spec/props.json, for example "acousticGuitar" or "camera". */
    prop: MascotProp;
    surface?: Surface;
    /** Visual size in px (default 96): the prop covers about size by size, no side over 1.5 times size. */
    size?: number;
    /** Accessible name; defaults to the prop's name. Pass "" to hide from assistive tech. */
    title?: string;
    /** Purely decorative: adds aria-hidden, so assistive tech skips it. */
    decorative?: boolean;
    className?: string;
    style?: CSSProperties;
}
export declare function PropStatic({ prop, surface, size, title, decorative, className, style }: PropStaticProps): import("react").JSX.Element;
