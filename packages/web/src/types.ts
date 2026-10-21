// Types for spec/ format 1. See spec/README.md and docs/renderer-contract.md.

export type Surface = 'light' | 'dark';

export interface PaletteDoc {
  format: 1;
  tokens: string[];
  surfaces: Record<Surface, Record<string, string | null>>;
}

export type TransformOp =
  | ['translate', number, number]
  | ['scale', number, number]
  | ['rotate', number, number, number];

export interface Paint {
  fill: string | null;
  stroke?: string | null;
  strokeWidth?: number;
  cap?: 'butt' | 'round' | 'square';
  join?: 'miter' | 'round' | 'bevel';
}

interface PrimBase {
  transform?: TransformOp[];
  /** Reserved for animated props (format 1 players draw the prop at rest and ignore it). */
  track?: string;
}

export type Prim =
  | (PrimBase & Paint & { type: 'rect'; x: number; y: number; w: number; h: number; rx: number; ry: number })
  | (PrimBase & Paint & { type: 'circle'; cx: number; cy: number; r: number })
  | (PrimBase & Paint & { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number })
  | (PrimBase & Paint & { type: 'path'; d: string })
  | (PrimBase & { type: 'group'; children: Layer[] });

export interface ActorLayer { type: 'actor'; actor: number }
export type Layer = Prim | ActorLayer;

export type EyeType = 'oval' | 'big' | 'small' | 'lid' | 'slantL' | 'slantR' | 'arc' | 'cup' | 'line' | 'x' | 'none';
export type MouthType = 'curve' | 'line' | 'big' | 'soft' | 'frown' | 'o' | 'smirk' | 'D' | 'wavy' | 'none';

/** A character pose in body units (the tile is 64 by 54). */
export interface Pose {
  x: number; y: number; tilt: number; sx: number; sy: number;
  eyeL: EyeType; eyeR: EyeType; edx: number; edy: number; blink: number;
  mouth: MouthType; mw: number; mdx: number; mdy: number;
  footL: number; footR: number; footLRot: number; footRRot: number;
  aL: number; aLx: number; aLy: number; aLang: number; aLlen: number; aLthumb: number;
  aR: number; aRx: number; aRy: number; aRang: number; aRlen: number; aRthumb: number;
  fold: number; badge: number;
  /** Ground shadow size factor (1 when absent). Only additive clips set it; rest poses never carry it. */
  shadow?: number;
  eyeLPrev?: EyeType | null; eyeLFade?: number;
  eyeRPrev?: EyeType | null; eyeRFade?: number;
  mouthPrev?: MouthType | null; mouthFade?: number;
}

export interface Actor { cx: number; by: number; s: number; shadow: boolean; rest: Pose }

export interface MotionRef {
  id: string;
  plays: 'once' | 'loop';
  then: 'idle' | null;
  actors: { actor: number; offset: number }[];
}

export interface StateDef {
  key: string;
  group: string;
  name: string;
  use: string;
  actors: Actor[];
  layers: Layer[];
  motion: MotionRef;
}

export interface StatesDoc {
  format: 1;
  canvas: { width: number; height: number };
  ground: number;
  groups: string[];
  idle: { motion: string; actorOffset: number };
  blink: { motion: string; gapMin: number; gapMax: number; doubleChance: number; doubleGap: number };
  states: StateDef[];
}

export interface Clip {
  format: 1;
  id: string;
  kind: 'absolute' | 'additive';
  source?: string;
  fps: number;
  frames: number;
  loop: boolean;
  introFrames: number;
  duration: number;
  fields: string[];
  constants: Record<string, number>;
  eyeTypes?: EyeType[];
  mouthTypes?: MouthType[];
  /** Reserved for animated prop tracks (format 1 players ignore it). */
  props?: Record<string, unknown>;
  rows: number[][];
}

/** A state as the static entry carries it: everything but the motion reference. */
export type StaticStateDef = Omit<StateDef, 'motion'>;

/** What the static entry embeds: palette, canvas, ground and the states, with no motion, idle or blink data. */
export interface StaticSpecData {
  palette: PaletteDoc;
  canvas: { width: number; height: number };
  ground: number;
  states: StaticStateDef[];
}

export interface SpecData {
  palette: PaletteDoc;
  states: StatesDoc;
  motion: Record<string, Clip>;
}
