// The smoothing rig, extended to the full pose vocabulary.
// Derived from makeRig() in tools/source/buddy-anim.cjs (copied from claude-brain/design-work/mascot/
// buddy-anim/buddy-anim.js). The engine's channels behave exactly as in the original:
// tests/rig.test.mjs runs both rigs on the engine showreel and checks they agree.
// Added channels: mdy, mw, foot rotations, and arm anchor, length and thumb per side.
//
// Input and output poses use tools/lib/pose.mjs fields (body units). Arm presence aL/aR in the input
// is a want flag (>= 0.5 means the arm is there); in the output it is the smoothed presence 0..1.

export function makeRig() {
  const cur = {}, vel = {}, kind = {}, prev = {}, fade = {};
  const last = { L: { ang: 0 }, R: { ang: 0 } };
  const TAU = {
    y: .06, x: .07, tilt: .07, sx: .05, sy: .05, edx: .05, edy: .05, mdx: .06, footL: .05, footR: .05, blink: .03,
    aLang: .06, aRang: .06, aL: .08, aR: .08,
    // added
    mdy: .06, mw: .06, footLRot: .05, footRRot: .05,
    aLx: .06, aLy: .06, aLlen: .06, aRx: .06, aRy: .06, aRlen: .06,
  };
  const damp = (k, target, dt) => { // SmoothDamp (critically damped spring), as in the engine
    if (cur[k] == null) { cur[k] = target; vel[k] = 0; return target; }
    const om = 2 / TAU[k], x = om * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const ch = cur[k] - target, tmp = (vel[k] + om * ch) * dt;
    vel[k] = (vel[k] - om * tmp) * e; cur[k] = target + (ch + tmp) * e; return cur[k];
  };
  const wrap = d => ((d + 540) % 360) - 180;
  const track = (key, value, dt) => {
    if (kind[key] === undefined) { kind[key] = value; fade[key] = 1; }
    else if (value !== kind[key]) { prev[key] = kind[key]; kind[key] = value; fade[key] = 0; }
    fade[key] = Math.min(1, fade[key] + dt / 0.14);
  };
  const DEF = { sx: 1, sy: 1, blink: 1, mw: 7 };
  function step(p, dt) {
    dt = Math.max(0.001, Math.min(0.05, dt));
    const out = { ...p };
    for (const k of ['y', 'x', 'sx', 'sy', 'edx', 'edy', 'mdx', 'footL', 'footR', 'blink', 'mdy', 'mw', 'footLRot', 'footRRot']) {
      out[k] = damp(k, p[k] == null ? (DEF[k] ?? 0) : p[k], dt);
    }
    if (cur.tilt != null) cur.tilt = wrap(cur.tilt); // spins stay continuous across 360
    out.tilt = damp('tilt', (cur.tilt == null ? 0 : cur.tilt) + (p.tilt == null ? 0 : wrap((p.tilt || 0) - (cur.tilt || 0))), dt);
    for (const s of ['L', 'R']) {
      const a = 'a' + s, want = (p[a] || 0) >= 0.5, was = cur[a] == null ? 0 : cur[a];
      if (want) {
        if (was < 0.05) { // arm appears: snap its geometry, as the engine snaps the angle
          for (const f of ['ang', 'x', 'y', 'len']) { cur[a + f] = p[a + f]; vel[a + f] = 0; }
        }
        last[s] = { ang: p[a + 'ang'], x: p[a + 'x'], y: p[a + 'y'], len: p[a + 'len'], thumb: p[a + 'thumb'] || 0 };
      }
      const pres = damp(a, want ? 1 : 0, dt);
      out[a + 'ang'] = damp(a + 'ang', last[s].ang, dt);
      for (const f of ['x', 'y', 'len']) out[a + f] = last[s][f] == null ? p[a + f] : damp(a + f, last[s][f], dt);
      out[a + 'thumb'] = last[s].thumb || 0;
      out[a] = Math.min(1, pres);
    }
    track('e0', p.eyeL, dt); track('e1', p.eyeR, dt); track('m', p.mouth, dt);
    out.eyeL = kind.e0; out.eyeLPrev = prev.e0 ?? null; out.eyeLFade = fade.e0;
    out.eyeR = kind.e1; out.eyeRPrev = prev.e1 ?? null; out.eyeRFade = fade.e1;
    out.mouth = kind.m; out.mouthPrev = prev.m ?? null; out.mouthFade = fade.m;
    return out;
  }
  return { step };
}
