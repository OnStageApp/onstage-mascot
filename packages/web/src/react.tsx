'use client';
// The React component. Server render: the state's resting pose as inline SVG. In the browser it plays
// the state's motion once, then idles with random blinks; it pauses while the tab is hidden and
// respects prefers-reduced-motion unless `reducedMotion` is given.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Surface } from './types.js';
import { renderFrameSvg } from './render.js';
import { createPlayer, type Player } from './player.js';
import { getState } from './pose.js';

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

const QUERY = '(prefers-reduced-motion: reduce)';

function usePrefersReducedMotion(): boolean {
  // Read synchronously on the client so the first effect already knows; the server assumes false
  // (nothing in the markup depends on it, so hydration cannot mismatch).
  const [reduce, setReduce] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(QUERY).matches);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(QUERY);
    setReduce(mq.matches);
    const on = () => setReduce(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduce;
}

export function Buddy({ state, surface = 'light', size = 160, playOnMount = true, onDone, reducedMotion, label, className, style }: BuddyProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const player = useRef<Player | null>(null);
  const done = useRef(onDone);
  done.current = onDone;
  const prefers = usePrefersReducedMotion();
  const reduced = reducedMotion ?? prefers;

  // What the server renders and the first client paint shows: the resting pose (frame 0 of every motion).
  const initial = useMemo(() => renderFrameSvg(state, {}, { surface, size }), [state, surface, size]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const p = createPlayer({ state, surface, size, target: el, playOnMount, reducedMotion: reduced, onDone: () => done.current?.() });
    player.current = p;
    return () => { p.destroy(); player.current = null; };
    // Surface and reduced motion are applied in place below; a new state or size restarts the player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, size, playOnMount]);

  useEffect(() => { player.current?.setSurface(surface); }, [surface]);
  useEffect(() => { player.current?.setReducedMotion(reduced); }, [reduced]);

  const name = label ?? getState(state).name;
  return (
    <span
      ref={ref}
      className={className}
      role={name ? 'img' : undefined}
      aria-label={name || undefined}
      aria-hidden={name ? undefined : true}
      style={{ display: 'inline-block', width: size, height: size, lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: initial }}
    />
  );
}
