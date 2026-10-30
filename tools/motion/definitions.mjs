// Motion sources. Each entry is a target pose over time; the baker runs it through the rig at 60 fps
// and stores the smoothed result as 30 fps frames in spec/motion/<id>.json. Players never see this file.
//
// Bespoke clips are "absolute": they return a full pose (tools/lib/pose.mjs) for the state's first actor,
// starting from and settling back to that actor's rest pose. Shared clips (pop, idle, blink) are
// "additive": they return offsets around the neutral pose, applied on top of any state's rest pose.
// Additive clips may also carry `shadow`, a factor on the ground shadow's size (1 when absent).
// Units: body units for positions, degrees for angles. Engine actions are in canvas units at scale 3
// and are converted by fromEngine().
import { loadEngine } from '../lib/sources.mjs';
import { fromEngine, neutralPose } from '../lib/pose.mjs';
import { ease, seg, arcUp, lerp, wob, blinkAt } from './helpers.mjs';

// The 15 key states with their own motion. Every other state uses the shared `pop`.
export const BESPOKE = [
  'hello', 'welcome-team', 'all-set', 'no-events', 'no-results', 'event-created', 'invite-sent',
  'plan-ready', 'done', 'waiting', 'offline', 'oops', 'loading', 'session-expired', 'sleepy',
];

let E = null;
const engine = () => (E ||= loadEngine());
const eng = (name, t, rest, o) => fromEngine(engine().ACTIONS[name].pose(t), rest, o);

// ctx: { actor, ground } for the state's first actor; groundY is how far below the rest placement the
// ground is, in body units (non-zero only when the rest pose floats, as in all-set).
export const MOTIONS = {
  // ---------- bespoke, re-using engine actions ----------
  hello: {
    kind: 'absolute', dur: 2.0, isNew: false,
    source: 'engine action hello, cut at 2.0 s while the hand is still up, then settle to rest',
    target: (t, rest) => eng('hello', t, rest),
  },
  'all-set': {
    kind: 'absolute', dur: 1.95, isNew: false,
    source: 'engine action success (big spin hop, landing on the ground), then a small hop up into the mid-air rest pose',
    target: (t, rest, { groundY }) => {
      // the engine hop is scaled to 0.7 so the spin stays inside the 240 canvas from the raised rest spot
      if (t < 1.5) { const p = eng('success', t, rest); p.y = p.y * 0.7 + groundY; return p; }
      const crouch = t < 1.62 ? arcUp(seg(t, 1.5, 1.74)) : 0, rise = ease(seg(t, 1.6, 1.88));
      const p = { ...rest, y: groundY * (1 - rise) };
      p.sy = rest.sy * (1 - 0.14 * crouch + 0.06 * arcUp(seg(t, 1.6, 1.92)));
      p.sx = rest.sx * (1 + 0.1 * crouch);
      if (t < 1.62) Object.assign(p, { footL: 0, footR: 0, footLRot: 0, footRRot: 0 });
      return p;
    },
  },
  'no-results': {
    kind: 'absolute', dur: 2.3, isNew: false,
    source: 'engine action think, cut at 2.3 s before it unwinds, then settle to rest',
    target: (t, rest) => eng('think', t, rest),
  },
  'event-created': {
    kind: 'absolute', dur: 2.4, isNew: false,
    source: 'engine action success (spin hop and a small hop), then settle to rest',
    target: (t, rest) => eng('success', t, rest),
  },
  'plan-ready': {
    kind: 'absolute', dur: 2.1, isNew: false,
    source: 'engine action proud, cut at 2.1 s, then settle to rest',
    target: (t, rest) => eng('proud', t, rest),
  },
  loading: {
    kind: 'absolute', loop: true, period: 1.6, isNew: false,
    source: 'engine action loading (two hops, glancing left then right), looped; the intro is one period from rest',
    target: (t, rest) => eng('loading', t % 1.6, rest),
  },
  'session-expired': {
    kind: 'absolute', dur: 3.1, isNew: false,
    source: 'engine action sleepy (droop, jerk awake, droop), tilt mirrored to match the rest pose, cut at 3.1 s, then settle',
    target: (t, rest) => eng('sleepy', t, rest, { mirrorTilt: true }),
  },
  sleepy: {
    kind: 'absolute', dur: 3.1, isNew: false,
    source: 'engine action sleepy, tilt mirrored to match the rest pose, cut at 3.1 s, then settle',
    target: (t, rest) => eng('sleepy', t, rest, { mirrorTilt: true }),
  },
  oops: {
    kind: 'absolute', dur: 1.75, isNew: true,
    source: 'engine action surprised for 1.0 s, then a new deflate (sag, lidded eyes, arms drop), then settle to rest',
    target: (t, rest) => {
      if (t < 1.0) return eng('surprised', t, rest);
      const d = ease(seg(t, 1.0, 1.45));
      return {
        ...rest, eyeL: 'lid', eyeR: 'lid', mouth: 'soft', aL: 0, aR: 0,
        sy: rest.sy * (1 - 0.1 * d), sx: rest.sx * (1 + 0.07 * d), y: 0.7 * d, tilt: 3 * d, edy: 1.5 * d, blink: 1,
      };
    },
  },
  // ---------- bespoke, new ----------
  'welcome-team': {
    kind: 'absolute', dur: 1.8, isNew: true,
    source: 'new: holds up the team badge and glances at it, the free arm waving (the body stays put so the badge stays in his hand)',
    target: (t, rest) => {
      const k = ease(seg(t, 0, 0.25)) * (1 - ease(seg(t, 1.5, 1.8))), w = wob(t, 2.5), look = ease(seg(t, 0.2, 0.6)) - ease(seg(t, 1.2, 1.6));
      return {
        ...rest,
        edx: rest.edx + 3 * look, edy: rest.edy - 1.5 * look,
        aLy: rest.aLy - 8.5 * k, aLlen: rest.aLlen + 10 * k,
        aLang: rest.aLang + k * (58 + 14 * w),
      };
    },
  },
  'no-events': {
    kind: 'absolute', dur: 3.6, isNew: true,
    source: 'new: looks slowly from the empty week to the left and back, with a blink at the far point',
    target: (t, rest) => {
      const look = ease(seg(t, 0.4, 1.3)) - ease(seg(t, 2.0, 2.9));
      return {
        ...rest, edx: rest.edx - 8 * look, tilt: rest.tilt - 3 * look, x: rest.x - 0.6 * look,
        edy: rest.edy + 0.6 * (arcUp(seg(t, 0.4, 1.3)) + arcUp(seg(t, 2.0, 2.9))),
        blink: rest.blink * blinkAt(t - 1.6),
      };
    },
  },
  'invite-sent': {
    kind: 'absolute', dur: 2.6, isNew: true,
    source: 'new: watches the paper plane fly up and away, leaning back, with a little wave',
    target: (t, rest) => {
      const watch = ease(seg(t, 0.1, 0.5)) * (1 - ease(seg(t, 1.9, 2.3))), fly = ease(seg(t, 0.3, 1.6));
      const wave = ease(seg(t, 0.9, 1.1)) * (1 - ease(seg(t, 1.9, 2.2)));
      const p = { ...rest };
      if (watch > 0.3) { p.eyeL = 'oval'; p.eyeR = 'oval'; }
      p.edx = lerp(rest.edx, 3 + 2.5 * fly, watch); p.edy = lerp(rest.edy, -2 - 4 * fly, watch);
      p.tilt = rest.tilt - 5 * fly * watch; p.y = -1.2 * fly * watch;
      p.sy = rest.sy * (1 + 0.04 * fly * watch); p.sx = rest.sx * (1 - 0.02 * fly * watch);
      p.aRang = rest.aRang + 16 * wave * wob(t - 0.9, 3);
      return p;
    },
  },
  done: {
    kind: 'absolute', dur: 1.5, isNew: true,
    source: 'new: two small nods, the second smaller',
    target: (t, rest) => {
      const n = arcUp(seg(t, 0.15, 0.55)) + 0.75 * arcUp(seg(t, 0.6, 0.95));
      return {
        ...rest, edy: rest.edy + 2.4 * n, mdy: rest.mdy + 1.4 * n, sy: rest.sy * (1 - 0.045 * n),
        sx: rest.sx * (1 + 0.02 * n), tilt: rest.tilt + 2 * n, y: rest.y + 0.3 * n,
      };
    },
  },
  waiting: {
    kind: 'absolute', dur: 2.6, isNew: true,
    source: 'new: three foot taps with the raised foot, then a quick glance to the front and back to the bubble',
    target: (t, rest) => {
      const d = t >= 0.2 && t < 1.55 ? arcUp((seg(t, 0.2, 1.55) * 3) % 1) : 0; // 1 = foot flat on the ground
      const glance = ease(seg(t, 1.7, 1.85)) * (1 - ease(seg(t, 2.1, 2.3)));
      const sway = ease(seg(t, 0, 0.3)) * (1 - ease(seg(t, 2.2, 2.6)));
      return {
        ...rest, footRRot: rest.footRRot * (1 - d), footR: rest.footR * (1 - d),
        sy: rest.sy * (1 - 0.02 * d), sx: rest.sx * (1 + 0.012 * d),
        edx: lerp(rest.edx, 0, glance), edy: lerp(rest.edy, 1, glance), tilt: rest.tilt + 1.5 * wob(t, 0.8) * sway,
      };
    },
  },
  offline: {
    kind: 'absolute', dur: 2.9, isNew: true,
    source: 'new: droops, reaches for the cable and gives it two small tugs, then recovers',
    target: (t, rest) => {
      const droop = ease(seg(t, 0, 0.9)) * (1 - ease(seg(t, 2.3, 2.9)));
      const tug = arcUp(seg(t, 1.0, 1.3)) + arcUp(seg(t, 1.45, 1.75));
      const reach = ease(seg(t, 0.8, 1.0)) * (1 - ease(seg(t, 1.85, 2.1)));
      const p = {
        ...rest, sy: rest.sy * (1 - 0.08 * droop), sx: rest.sx * (1 + 0.05 * droop), edy: rest.edy + 1.5 * droop,
        y: 0.4 * droop, tilt: rest.tilt - 3 * droop - 5 * tug, x: -1.0 * tug, blink: rest.blink * (1 - 0.25 * droop),
      };
      if (reach > 0.5) Object.assign(p, { aR: 1, aRx: 61, aRy: 30, aRang: 90 - 8 * tug, aRlen: 12, aRthumb: 0 });
      return p;
    },
  },

  // ---------- shared, additive ----------
  pop: {
    kind: 'additive', dur: 0.95, isNew: true,
    source: 'new: default for states without their own motion; a quick tuck, a pop up with stretch, then a springy settle',
    target: t => {
      const s1 = arcUp(seg(t, 0, 0.12)), s2 = arcUp(seg(t, 0.1, 0.32));
      const k = Math.max(0, t - 0.32), w3 = t > 0.32 ? -Math.exp(-7 * k) * Math.sin(18 * k) : 0;
      return { sy: 1 - 0.1 * s1 + 0.08 * s2 + 0.05 * w3, sx: 1 + 0.08 * s1 - 0.05 * s2 - 0.04 * w3, y: -2.2 * s2 };
    },
  },
  idle: {
    kind: 'additive', loop: true, period: 3, isNew: false,
    source: 'engine action idle (breathing, sway, eye drift), as offsets around the neutral pose',
    target: t => {
      const p = engine().ACTIONS.idle.pose(t % 3), n = neutralPose();
      return { x: (p.x || 0) / 3, tilt: p.tilt, sx: p.sx, sy: p.sy, edx: p.edx - n.edx, footL: p.footL };
    },
  },
  blink: {
    kind: 'additive', dur: 0.14, isNew: false,
    source: 'engine withBlink shape (140 ms), smoothed by the rig; a factor on eye height',
    target: t => ({ blink: blinkAt(t) }),
  },

  // ---------- extra, additive (played on demand with player.playClip, or by the ambient schedule) ----------
  // No state plays these on its own. Sizes are for a lone Buddy (s 2.2): one body unit is about 2 px at a
  // 220 px render, so y -6 is a 12 px hop and edx 4 moves the eyes 8 px.
  hop: {
    kind: 'additive', dur: 0.6, isNew: true,
    source: 'new: a small hop in place; tuck, stretch up about 6 body units, squash on landing and settle. The ground shadow stays on the ground and shrinks while Buddy is up',
    target: t => {
      const tuck = ease(seg(t, 0, 0.08)) * (1 - ease(seg(t, 0.08, 0.15)));
      const k = seg(t, 0.09, 0.43), air = 4 * k * (1 - k);   // parabola: top at 0.26 s
      const stretch = arcUp(seg(t, 0.1, 0.34)), land = arcUp(seg(t, 0.4, 0.54));
      const k2 = Math.max(0, t - 0.54), wobble = t > 0.54 ? Math.exp(-14 * k2) * Math.sin(26 * k2) : 0;
      return {
        y: -6.6 * air,
        sy: 1 - 0.09 * tuck + 0.09 * stretch - 0.11 * land + 0.03 * wobble,
        sx: 1 + 0.07 * tuck - 0.05 * stretch + 0.09 * land - 0.025 * wobble,
        shadow: 1 - 0.12 * air,
      };
    },
  },
  'glance-left': {
    kind: 'additive', dur: 1.4, isNew: true,
    source: 'new: the eyes glance to the left (edx -4, a little up), hold, and come back; the head tilts after them, with a half blink at the turn',
    target: t => glance(t, -1),
  },
  'glance-right': {
    kind: 'additive', dur: 1.4, isNew: true,
    source: 'new: the eyes glance to the right (edx +4, a little up), hold, and come back; the head tilts after them, with a half blink at the turn',
    target: t => glance(t, 1),
  },
  'look-around': {
    kind: 'additive', dur: 2.4, isNew: true,
    source: 'new: looks left, back to the centre with a blink, then right and back (the no-events look, made additive)',
    target: t => {
      const l = ease(seg(t, 0.1, 0.45)) * (1 - ease(seg(t, 0.8, 1.05)));
      const r = ease(seg(t, 1.2, 1.55)) * (1 - ease(seg(t, 1.95, 2.3)));
      return { edx: 4 * (r - l), edy: -0.5 * (l + r), tilt: 1.2 * (r - l), blink: blinkAt(t - 1.07) };
    },
  },
};

// One glance to side dir (-1 left, +1 right): eyes out over 0.25 s, hold 0.6 s, back over 0.35 s.
function glance(t, dir) {
  const look = ease(seg(t, 0, 0.25)) * (1 - ease(seg(t, 0.85, 1.2)));
  const head = ease(seg(t, 0.1, 0.4)) * (1 - ease(seg(t, 0.9, 1.3)));   // follows the eyes, a little late
  return { edx: 4 * dir * look, edy: -0.5 * look, tilt: 1.5 * dir * head, blink: 1 - 0.65 * arcUp(seg(t, 0.13, 0.27)) };
}
