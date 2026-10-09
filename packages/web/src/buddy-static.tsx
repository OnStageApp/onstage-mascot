// The static React component. No 'use client' on purpose: no hooks, no effects, no timers, so it renders
// in a React Server Component. It draws the state's resting pose as inline SVG and nothing else.
import type { CSSProperties } from 'react';
import type { Surface } from './types.js';
import { getStaticState, renderRestSvg } from './static-svg.js';

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

export function BuddyStatic({ state, surface = 'light', size = 160, title, decorative = false, className, style }: BuddyStaticProps) {
  const name = title ?? getStaticState(state).name;
  const hidden = decorative || !name;
  return (
    <span
      className={className}
      role={name ? 'img' : undefined}
      aria-label={name || undefined}
      aria-hidden={hidden ? true : undefined}
      style={{ display: 'inline-block', width: size, height: size, lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: renderRestSvg(state, { surface, size }) }}
    />
  );
}
