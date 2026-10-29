// A prop on its own (no Buddy), as inline SVG. No 'use client' on purpose: no hooks, no effects, so it
// renders in a React Server Component.
import type { CSSProperties } from 'react';
import type { MascotProp, Surface } from './types.js';
import { getProp, renderPropSvg } from './static-svg.js';

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

export function PropStatic({ prop, surface = 'light', size = 96, title, decorative = false, className, style }: PropStaticProps) {
  const name = title ?? getProp(prop).name;
  const hidden = decorative || !name;
  return (
    <span
      className={className}
      role={name && !hidden ? 'img' : undefined}
      aria-label={name && !hidden ? name : undefined}
      aria-hidden={hidden ? true : undefined}
      style={{ display: 'inline-block', lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: renderPropSvg(prop, { surface, size }) }}
    />
  );
}
