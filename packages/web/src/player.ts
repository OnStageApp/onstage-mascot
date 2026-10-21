// A framework-agnostic player: owns the clock, the phase machine and the blink schedule, and hands
// each frame to a target element or callback as an SVG string. docs/renderer-contract.md, "Player".
import type { Clip, StateDef, Surface } from './types.js';
import { SPEC } from './spec-data.js';
import { getOverlayClip, getState, resolvePoses, sampleClip, type Phase } from './pose.js';
import { drawScene } from './svg.js';

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
  target?: { innerHTML: string } | null;
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
  setState(key: string, opts?: { play?: boolean }): void;
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

const MAX_DT = 0.1;

export function createPlayer(opts: PlayerOptions): Player {
  const rand = opts.random ?? Math.random;
  const B = SPEC.states.blink;
  const blinkClip = SPEC.motion[B.motion];
  const g = globalThis as { requestAnimationFrame?: (cb: (ms: number) => void) => unknown; cancelAnimationFrame?: (h: unknown) => void; document?: Document };
  const reqF = opts.requestFrame ?? (g.requestAnimationFrame ? g.requestAnimationFrame.bind(g) : undefined);
  const canF = opts.cancelFrame ?? (g.cancelAnimationFrame ? g.cancelAnimationFrame.bind(g) : undefined);
  const auto = (opts.autoStart ?? true) && !!reqF;

  let st: StateDef = getState(opts.state);
  let surface: Surface = opts.surface ?? 'light';
  let reduced = !!opts.reducedMotion;
  let phase: Phase = 'rest';
  let t = 0;
  let end = 0;
  let blinkNext: number[] = [];
  let blinkStart: number[] = [];
  let current = '';
  let handle: unknown = null;
  let last: number | null = null;
  let userPaused = false;
  let hidden = false;
  let destroyed = false;
  let overlay: { id: string; clip: Clip; t: number; then: 'idle' | null; onDone?: () => void } | null = null;
  let ambient: { clips: Clip[]; ids: string[]; gapMin: number; gapMax: number; random: () => number } | null = null;
  let ambientNext = Infinity;

  function setAmbientOpts(a: AmbientOptions | null | undefined) {
    if (!a || !a.clips.length) { ambient = null; ambientNext = Infinity; return; }
    const gapMin = a.gapMin ?? 6;
    ambient = { ids: [...a.clips], clips: a.clips.map(getOverlayClip), gapMin, gapMax: Math.max(gapMin, a.gapMax ?? 10), random: a.random ?? Math.random };
    ambientNext = phase === 'idle' ? t + ambientGap() : Infinity;
  }
  function ambientGap() { return ambient ? ambient.gapMin + (ambient.gapMax - ambient.gapMin) * ambient.random() : Infinity; }
  setAmbientOpts(opts.ambient);

  const gap = () => B.gapMin + (B.gapMax - B.gapMin) * rand();
  const blinks = () => phase === 'idle' || (phase === 'motion' && st.motion.plays === 'loop');

  function initBlinks() {
    blinkStart = st.actors.map(() => -Infinity);
    blinkNext = st.actors.map(() => t + gap());
  }

  function blinkFactors(): number[] | undefined {
    if (!blinks() || !blinkClip) return undefined;
    return st.actors.map((_, i) => {
      while (t >= blinkNext[i]) {
        blinkStart[i] = blinkNext[i];
        blinkNext[i] = blinkStart[i] + (rand() < B.doubleChance ? B.doubleGap : gap());
      }
      const d = t - blinkStart[i];
      return d >= 0 && d <= blinkClip.duration ? (sampleClip(blinkClip, d).blink as number) : 1;
    });
  }

  function render() {
    const svg = drawScene(st, resolvePoses(st, phase, t, blinkFactors(), overlay), { surface, size: opts.size, background: opts.background, attrs: opts.attrs });
    if (svg === current) return;
    current = svg;
    if (opts.target) opts.target.innerHTML = svg;
    opts.onFrame?.(svg);
  }

  function enterIdle() { phase = 'idle'; t = 0; initBlinks(); ambientNext = ambient ? ambientGap() : Infinity; }

  function startOverlay(id: string, clip: Clip, o?: PlayClipOptions) {
    overlay = { id, clip, t: 0, then: o?.then === undefined ? 'idle' : o.then, onDone: o?.onDone };
  }

  function start(play: boolean) {
    t = 0; last = null; overlay = null; ambientNext = Infinity;
    if (reduced) {
      phase = 'rest'; render(); stopLoop();
      if (play && st.motion.plays === 'once' && opts.onDone) queueMicrotask(() => { if (!destroyed) opts.onDone!(); });
      return;
    }
    if (play) {
      phase = 'motion';
      const clip = SPEC.motion[st.motion.id];
      end = (clip ? clip.duration : 0) + Math.max(0, ...st.motion.actors.map(a => a.offset));
      if (st.motion.plays === 'loop') initBlinks();
    } else enterIdle();
    render();
    startLoop();
  }

  function tick(dt: number) {
    t += Math.min(Math.max(dt, 0), MAX_DT);
    if (phase === 'motion' && st.motion.plays === 'once' && t >= end) {
      if (st.motion.then === 'idle') enterIdle(); else { phase = 'rest'; t = 0; }
      opts.onDone?.();
    }
    if (overlay) {
      overlay.t += Math.min(Math.max(dt, 0), MAX_DT);
      if (overlay.t >= overlay.clip.duration) {
        const o = overlay;
        overlay = null;
        if (o.then === 'idle' && phase === 'rest') enterIdle();
        o.onDone?.();
      }
    }
    if (ambient && phase === 'idle' && !overlay && t >= ambientNext) {
      const i = Math.min(ambient.clips.length - 1, Math.floor(ambient.random() * ambient.clips.length));
      startOverlay(ambient.ids[i], ambient.clips[i]);
      ambientNext = t + ambient.clips[i].duration + ambientGap();
    }
    render();
  }

  function frame(ms: number) {
    handle = null;
    if (destroyed || userPaused || hidden) return;
    const dt = last == null ? 0 : (ms - last) / 1000;
    last = ms;
    tick(dt);
    if (phase !== 'rest' || overlay) handle = reqF!(frame);
  }
  function startLoop() {
    if (!auto || handle != null || destroyed || userPaused || hidden || reduced || (phase === 'rest' && !overlay)) return;
    last = null;
    handle = reqF!(frame);
  }
  function stopLoop() {
    if (handle != null && canF) canF(handle);
    handle = null; last = null;
  }

  const doc = g.document;
  const onVis = () => { hidden = !!doc?.hidden; if (hidden) stopLoop(); else startLoop(); };
  if ((opts.pauseWhenHidden ?? true) && doc?.addEventListener) {
    hidden = !!doc.hidden;
    doc.addEventListener('visibilitychange', onVis);
  }

  start(opts.playOnMount ?? true);

  return {
    get stateKey() { return st.key; },
    get phase() { return phase; },
    get time() { return t; },
    play() { stopLoop(); start(true); },
    get clip() { return overlay?.id ?? null; },
    playClip(id, o) {
      const clip = getOverlayClip(id);
      if (destroyed) return;
      if (reduced) {
        if (o?.onDone) queueMicrotask(() => { if (!destroyed) o.onDone!(); });
        return;
      }
      startOverlay(id, clip, o);
      render();
      startLoop();
    },
    setAmbient(a) { setAmbientOpts(a); },
    setState(key, o) { st = getState(key); stopLoop(); start(o?.play ?? true); },
    setSurface(s) { surface = s; current = ''; render(); },
    setReducedMotion(on) {
      if (on === reduced) return;
      reduced = on; stopLoop();
      if (on) {
        const o = overlay;
        overlay = null; phase = 'rest'; t = 0; render();
        o?.onDone?.();
      } else start(false);
    },
    advance(dt) { if (!destroyed && !reduced) tick(dt); },
    pause() { userPaused = true; stopLoop(); },
    resume() { userPaused = false; startLoop(); },
    destroy() {
      destroyed = true; overlay = null; stopLoop();
      if (doc?.removeEventListener) doc.removeEventListener('visibilitychange', onVis);
    },
    svg: () => current,
  };
}
