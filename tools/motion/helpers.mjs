// Timing helpers, copied from the motion section of tools/source/buddy-anim.cjs
// (claude-brain/design-work/mascot/buddy-anim/buddy-anim.js), where they are private to the engine.
export const clamp = t => Math.max(0, Math.min(1, t));
export const ease = t => t * t * t * (t * (t * 6 - 15) + 10);   // smootherstep
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const arcUp = t => Math.sin(Math.PI * clamp(t));          // 0 -> 1 -> 0
export const settle = t => 1 - Math.exp(-6 * t) * Math.cos(10 * t); // damped spring 0 -> 1
export const lerp = (a, b, k) => a + (b - a) * k;
export const wob = (t, hz) => Math.sin(2 * Math.PI * hz * t);
// One hop: crouch, stretch in the air, squash on landing with a spring. k runs 0..1. h in canvas units at scale 3.
export function hop(k, h) {
  if (k < 0.2) { const a = ease(k / 0.2); return { y: 0, sy: 1 - 0.16 * a, sx: 1 + 0.12 * a, air: 0 }; }
  if (k < 0.7) {
    const a = (k - 0.2) / 0.5, s = arcUp(a);
    const sy = lerp(0.84, 1, ease(Math.min(1, a * 3))) + 0.14 * s;
    return { y: -h * s, sy, sx: 1 + (1 - sy) * 0.7, air: s };
  }
  const a = (k - 0.7) / 0.3, sy = 1 - 0.2 * (1 - settle(a));
  return { y: 0, sy, sx: 1 + (1 - sy) * 0.8, air: 0 };
}
// The engine's blink shape (withBlink): 140 ms, 1 -> 0.1 -> 1.
export const blinkAt = d => (d >= 0 && d < 0.14 ? Math.abs(d - 0.07) / 0.07 * 0.9 + 0.1 : 1);
