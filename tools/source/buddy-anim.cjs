// COPIED VERBATIM from claude-brain/design-work/mascot/buddy-anim/buddy-anim.js (2026-10-08).
// Only this header was added. Do not edit; it is the reference engine the baker runs.
// Buddy, animated in code. One file drives both the browser demo (buddy.html)
// and the video export (export.js), so the motion is identical in both.
// Geometry and colours match the "Mascot/Buddy App" component set.
(function (root) {
  const C = { body: '#A4D4E3', navy: '#00275C', shadow: '#7FBFD3' };
  const W = 64, H = 54, R = 24, RS = 7;          // logo tile: round TR and BL corners
  const S = 3, CX = 160, GY = 250;               // scale, centre x, ground line (320 x 320 canvas)
  const f = v => +v.toFixed(2);

  const tile = `M${RS} 0H${W - R}A${R} ${R} 0 0 1 ${W} ${R}V${H - RS}A${RS} ${RS} 0 0 1 ${W - RS} ${H}H${R}A${R} ${R} 0 0 1 0 ${H - R}V${RS}A${RS} ${RS} 0 0 1 ${RS} 0Z`;
  const rr = (x, y, w, h, rx, c, t) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${rx}" fill="${c}"${t ? ` transform="${t}"` : ''}/>`;
  const sk = (d, w) => `<path d="${d}" stroke="${C.navy}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;

  function eye(type, x, y, blink) {
    if (type === 'arc') return sk(`M${f(x - 5.5)} ${f(y + 2.4)}Q${f(x)} ${f(y - 5)} ${f(x + 5.5)} ${f(y + 2.4)}`, 3.8);
    if (type === 'line') return sk(`M${f(x - 5.5)} ${f(y + 1)}H${f(x + 5.5)}`, 3.8);
    if (type === 'lid') return `<path d="M${f(x - 5.2)} ${f(y - 0.7)}A5.2 7 0 0 0 ${f(x + 5.2)} ${f(y - 0.7)}Z" fill="${C.navy}"/>`;
    if (type === 'x') return sk(`M${f(x - 4.5)} ${f(y - 4.5)}L${f(x + 4.5)} ${f(y + 4.5)}M${f(x + 4.5)} ${f(y - 4.5)}L${f(x - 4.5)} ${f(y + 4.5)}`, 3.6);
    return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="5.2" ry="${f(Math.max(1.9, 7 * blink))}" fill="${C.navy}"/>`;
  }
  function mouth(type, x, y) {
    if (type === 'line') return sk(`M${f(x - 3.5)} ${f(y)}H${f(x + 3.5)}`, 3.4);
    if (type === 'big') return sk(`M${f(x - 4.5)} ${f(y - 1.6)}Q${f(x)} ${f(y + 4.6)} ${f(x + 4.5)} ${f(y - 1.6)}`, 3.4);
    if (type === 'frown') return sk(`M${f(x - 3.5)} ${f(y + 1)}Q${f(x)} ${f(y - 2.6)} ${f(x + 3.5)} ${f(y + 1)}`, 3.4);
    if (type === 'wavy') return sk(`M${f(x - 6)} ${f(y)}q2 -2.4 4 0t4 0t4 0`, 3);
    if (type === 'o') return `<circle cx="${f(x)}" cy="${f(y + 0.6)}" r="2.8" stroke="${C.navy}" stroke-width="3" fill="none"/>`;
    return sk(`M${f(x - 3.5)} ${f(y - 1)}Q${f(x)} ${f(y + 3.2)} ${f(x + 3.5)} ${f(y - 1)}`, 3.4);       // small curve
  }
  // Stub arm from the body edge; angle 0 points straight up.
  const arm = (bx, by, ang, len, c) => rr(bx - 4.5, by - len, 9, len + 4.5, 4.5, c, `rotate(${f(ang)} ${f(bx)} ${f(by)})`);

  // A full-size car facing right, in the accent colour; x is its left edge (330 wide, wider than Buddy).
  function car(x, overPie) {
    const by = GY + 8 - (overPie && Math.abs(x + 165 - CX) < 200 ? 6 : 0);
    const cc = '#F28B7D', dark = '#B8473A', glass = '#CBE6EE';
    const wheel = cx => `<circle cx="${f(cx)}" cy="${f(by - 24)}" r="31" fill="${dark}"/><circle cx="${f(cx)}" cy="${f(by - 24)}" r="26" fill="${C.navy}"/><circle cx="${f(cx)}" cy="${f(by - 24)}" r="11" fill="${glass}"/><circle cx="${f(cx)}" cy="${f(by - 24)}" r="4" fill="${C.navy}"/>`;
    return `<g>`
      + `<path d="M${x + 78} ${by - 78}L${x + 108} ${by - 130}H${x + 238}L${x + 272} ${by - 78}Z" fill="${cc}" stroke="${cc}" stroke-width="8" stroke-linejoin="round"/>`
      + `<path d="M${x + 96} ${by - 84}L${x + 118} ${by - 120}H${x + 166}V${by - 84}Z" fill="${glass}"/>`
      + `<path d="M${x + 176} ${by - 84}V${by - 120}H${x + 226}L${x + 250} ${by - 84}Z" fill="${glass}"/>`
      + rr(x, by - 84, 330, 56, 20, cc)
      + `<path d="M${x + 171} ${by - 82}V${by - 34}" stroke="${dark}" stroke-width="3" stroke-linecap="round"/>`
      + rr(x + 150, by - 62, 14, 5, 2.5, dark) + rr(x + 292, by - 70, 30, 14, 6, '#FFFFFF') + rr(x + 6, by - 70, 14, 16, 5, dark)
      + rr(x - 4, by - 36, 338, 12, 6, dark)
      + wheel(x + 74) + wheel(x + 256)
      + `</g>`;
  }
  // Buddy flattened into a pie: crust ring, crimped edge, a dizzy face on top.
  function pie(p) {
    const cy = GY + 8, crust = '#7FBFD3';
    let s = `<ellipse cx="${CX}" cy="${cy + 6}" rx="104" ry="20" fill="${crust}"/>`;
    for (let i = 0; i < 22; i++) { const a = Math.PI * 2 * i / 22; s += `<circle cx="${f(CX + 100 * Math.cos(a))}" cy="${f(cy + 18 * Math.sin(a))}" r="7" fill="${crust}"/>`; }
    s += `<ellipse cx="${CX}" cy="${cy}" rx="90" ry="15" fill="${C.body}"/>`;
    const w = 1 + 0.03 * Math.sin((p.wob || 0) * 14);
    s += `<g transform="translate(${CX} ${cy}) scale(${f(2.6 * w)} 1.1) translate(-32 -31)">` + eye('x', 32 - 13, 26, 1) + eye('x', 32 + 13, 26, 1) + mouth('wavy', 32, 36) + `</g>`;
    return s;
  }

  // p: { y, sx, sy, tilt, eyes, blink, edx, edy, mouth, mdx, armL, armR, footL, footR }
  function render(p, opt = {}) {
    const feet = opt.navyFeet ? C.navy : C.body;
    const lift = Math.max(0, -p.y);
    let back = rr(W / 2 - 19, H - 6 - (p.footL || 0), 11, 13, 5.5, feet) + rr(W / 2 + 8, H - 6 - (p.footR || 0), 11, 13, 5.5, feet);
    if (p.armL != null) back += arm(3, H * 0.5, p.armL, 22 * (p.armLa == null ? 1 : p.armLa), C.body);
    if (p.armR != null) back += arm(W - 3, H * 0.5, p.armR, 22 * (p.armRa == null ? 1 : p.armRa), C.body);
    const ex = 13, ey = 25, dx = p.edx || 0, dy = p.edy || 0;
    const et = Array.isArray(p.eyes) ? p.eyes : [p.eyes, p.eyes];
    const mix = (cur, prev, fade, draw) => prev && fade < 1 ? `<g opacity="${f(1 - fade)}">${draw(prev)}</g><g opacity="${f(fade)}">${draw(cur)}</g>` : draw(cur);
    const face = mix(et[0], p.eyesPrev && p.eyesPrev[0], p.eyeFade && p.eyeFade[0], t => eye(t, W / 2 - ex + dx, ey + dy, p.blink))
      + mix(et[1], p.eyesPrev && p.eyesPrev[1], p.eyeFade && p.eyeFade[1], t => eye(t, W / 2 + ex + dx, ey + dy, p.blink))
      + mix(p.mouth, p.mouthPrev, p.mouthFade, t => mouth(t, 32 + (p.mdx || 0), 38));
    const buddy = `<g transform="translate(${f(CX - W * S / 2 + (p.x || 0))} ${f(GY - H * S + p.y)}) scale(${S})">`
      + `<g transform="rotate(${f(p.tilt || 0)} 32 27) translate(32 54) scale(${f(p.sx)} ${f(p.sy)}) translate(-32 -54)">`
      + back + `<path d="${tile}" fill="${C.body}"/>` + face + `</g></g>`;
    if (p.pie) return wrap(opt, pie(p) + (p.carX != null ? car(p.carX, true) : ''));
    const shadow = opt.navyFeet ? '' : `<ellipse cx="${f(CX + (p.x || 0))}" cy="${GY + 19}" rx="${f(84 * p.sx / (1 + lift / 90))}" ry="9" fill="${C.shadow}"/>`;
    return wrap(opt, shadow + buddy + (p.carX != null ? car(p.carX) : ''));
  }
  function wrap(opt, inner) {
    const bg = opt.bg ? `<rect width="320" height="320" fill="${opt.bg}"/>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">${bg}${inner}</svg>`;
  }

  // ---------- motion ----------
  const clamp = t => Math.max(0, Math.min(1, t));
  const ease = t => t * t * t * (t * (t * 6 - 15) + 10);   // smootherstep
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const arcUp = t => Math.sin(Math.PI * clamp(t));                      // 0 -> 1 -> 0
  const settle = t => 1 - Math.exp(-6 * t) * Math.cos(10 * t);          // damped spring 0 -> 1

  const base = () => ({ y: 0, sx: 1, sy: 1, tilt: 0, eyes: 'oval', blink: 1, edx: 0, edy: 0, mouth: 'curve', mdx: 0, armL: null, armR: null, footL: 0, footR: 0 });

  // Each action maps local time t (seconds) to a pose. dur is how long it runs.
  const ACTIONS = {
    idle: { dur: 3, pose: t => ({ ...base(), sy: 1 + 0.025 * Math.sin(2 * Math.PI * t / 3), sx: 1 - 0.012 * Math.sin(2 * Math.PI * t / 3) }) },
    hello: { dur: 1.6, pose: t => {
      const p = { ...base(), eyes: 'arc', mouth: 'big' };
      p.y = -22 * arcUp(seg(t, 0, 0.45));
      const up = ease(seg(t, 0.05, 0.3)) * (1 - ease(seg(t, 1.3, 1.6)));
      p.armR = 15 + 25 * up + 22 * up * Math.sin(2 * Math.PI * 2.4 * seg(t, 0.3, 1.3));
      p.tilt = -5 * up;
      return p; } },
    think: { dur: 1.6, pose: t => {
      const k = ease(seg(t, 0, 0.35)) * (1 - ease(seg(t, 1.3, 1.6)));
      return { ...base(), edx: -2.5 * k, edy: -3.5 * k, mouth: k > 0.3 ? 'line' : 'curve', mdx: 3 * k, tilt: -6 * k }; } },
    success: { dur: 1.6, pose: t => {
      const p = { ...base() };
      const crouch = arcUp(seg(t, 0, 0.36));
      const air = seg(t, 0.18, 0.7);
      const land = seg(t, 0.7, 1.6);
      p.y = -48 * arcUp(air);
      p.sy = 1 - 0.1 * crouch + (air > 0 && air < 1 ? 0.07 * arcUp(air) : 0) - (land > 0 ? 0.14 * (1 - settle(land)) : 0);
      p.sx = 1 + (1 - p.sy) * 0.8;
      if (t > 0.18) { p.eyes = 'arc'; p.mouth = 'big'; }
      if (air > 0 && air < 1) { p.armL = -38; p.armR = 38; p.footL = 3; p.footR = 3; }
      return p; } },
    loading: { dur: 1.2, pose: t => {
      const k = (t % 0.4) / 0.4;
      const p = { ...base(), eyes: 'oval', mouth: 'line' };
      p.y = -12 * arcUp(k); p.sy = 1 + 0.04 * arcUp(k) - (k < 0.15 ? 0.05 : 0); p.sx = 2 - p.sy;
      p.edy = -1.5 * arcUp(k);
      return p; } },
    sleepy: { dur: 2.4, pose: t => {
      const k = ease(seg(t, 0, 0.4)) * (1 - ease(seg(t, 2, 2.4)));
      return { ...base(), eyes: k > 0.5 ? 'line' : 'oval', blink: 1 - 0.6 * k, mouth: k > 0.4 ? 'o' : 'curve', tilt: 7 * k, sy: 1 - 0.06 * k + 0.02 * Math.sin(2 * Math.PI * t / 1.2) * k, sx: 1 + 0.05 * k }; } },
    crash: { dur: 7.2, pose: t => {
      const p = { ...base() };
      // 0 to 1.0: the car rolls in from the left; Buddy notices and freezes
      if (t < 1.0) p.carX = -420 + 154 * t;
      if (t > 0.45 && t < 1.0) { p.edx = -3; }
      if (t > 0.7 && t < 1.0) { p.mouth = 'o'; p.sy = 1.05; p.sx = 0.97; p.footL = 2; p.footR = 2; }
      // 1.0 to 1.3: impact, squashed sideways then flattened
      if (t >= 1.0 && t < 1.3) { const k = seg(t, 1.0, 1.3); p.carX = -266 + 60 * k; p.sx = 1 - 0.35 * arcUp(k * 0.5) + 0.7 * k; p.sy = 1 - 0.72 * k; p.eyes = 'x'; p.mouth = 'o'; }
      // 1.3 to 3.2: a pie; the car drives over it and away
      if (t >= 1.3 && t < 3.2) { p.pie = true; p.wob = t; p.carX = t < 2.6 ? -206 + 546 * seg(t, 1.3, 2.6) : null; }
      // 3.2 to 3.9: pops back with a spring
      if (t >= 3.2) { const k = seg(t, 3.2, 3.9); p.sy = 0.28 + 0.72 * settle(k * 1.2); p.sx = 1 + (1 - p.sy) * 0.9; p.eyes = k < 0.35 ? 'x' : 'oval'; p.mouth = k < 0.6 ? 'wavy' : 'curve'; }
      // 3.9 to 4.8: dizzy, eyes drift side to side
      if (t >= 3.9 && t < 4.8) { const k = seg(t, 3.9, 4.8); p.mouth = 'wavy'; p.edx = 3 * Math.sin(2 * Math.PI * 2 * k); p.tilt = 5 * Math.sin(2 * Math.PI * 1.5 * k) * (1 - k); }
      // 4.8 to 5.8: shakes his head, deadpan
      if (t >= 4.8 && t < 5.8) { const k = seg(t, 4.8, 5.8); p.eyes = 'lid'; p.mouth = 'line'; p.tilt = 5 * Math.sin(2 * Math.PI * 2 * k) * (1 - 0.4 * k); }
      // 5.8 to 6.5: relieved, a long breath out
      if (t >= 5.8 && t < 6.5) { const k = seg(t, 5.8, 6.5); p.eyes = 'arc'; p.mouth = 'o'; p.sy = 1 - 0.04 * arcUp(k); p.sx = 1 + 0.03 * arcUp(k); }
      // 6.5 to 7.2: proud, chin up
      if (t >= 6.5) { const k = ease(seg(t, 6.5, 6.9)); p.eyes = 'arc'; p.mouth = 'big'; p.tilt = 4 * k; p.sy = 1 + 0.04 * k; p.y = -3 * k; }
      return p; } },
    surprised: { dur: 1.6, pose: t => { const k = ease(seg(t, 0, 0.12)) * (1 - ease(seg(t, 1.2, 1.6))); return { ...base(), blink: 1 + 0.25 * k, mouth: k > 0.3 ? 'o' : 'curve', y: -10 * k, sy: 1 + 0.06 * k, sx: 1 - 0.03 * k, footL: 2 * k, footR: 2 * k }; } },
    proud: { dur: 1.8, pose: t => { const k = ease(seg(t, 0, 0.4)) * (1 - ease(seg(t, 1.4, 1.8))); return { ...base(), eyes: k > 0.4 ? 'arc' : 'oval', mouth: 'big', tilt: 4 * k, sy: 1 + 0.05 * k, y: -4 * k }; } },
    shy: { dur: 2, pose: t => { const k = ease(seg(t, 0, 0.4)) * (1 - ease(seg(t, 1.6, 2))); return { ...base(), edx: -3 * k, edy: 2 * k, mouth: k > 0.4 ? 'line' : 'curve', tilt: 8 * k, sx: 1 - 0.04 * k, footL: 2 * k }; } },
    sad: { dur: 2.4, pose: t => { const k = ease(seg(t, 0, 0.5)) * (1 - ease(seg(t, 1.9, 2.4))); return { ...base(), blink: 1 - 0.2 * k, edy: 2 * k, mouth: k > 0.4 ? 'frown' : 'curve', tilt: -3 * k, sy: 1 - 0.05 * k, sx: 1 + 0.03 * k }; } },
    excited: { dur: 2, pose: t => { const k = (t % 0.5) / 0.5, a = arcUp(k); return { ...base(), eyes: 'arc', mouth: 'big', y: -20 * a, sy: 1 + 0.05 * a - (k < 0.12 ? 0.07 : 0), sx: 1 - 0.03 * a, armL: -25 - 25 * a, armR: 25 + 25 * a, footL: 3 * a, footR: 3 * a }; } },
    wink: { dur: 1.6, pose: t => { const k = ease(seg(t, 0, 0.2)) * (1 - ease(seg(t, 1.2, 1.6))); return { ...base(), eyes: k > 0.5 ? ['arc', 'oval'] : 'oval', mouth: 'big', tilt: 5 * k, y: -2 * k }; } },
    laugh: { dur: 2, pose: t => { const k = Math.min(seg(t, 0, 0.2), 1 - seg(t, 1.7, 2)); const w = Math.sin(2 * Math.PI * 5 * t); return { ...base(), eyes: 'arc', mouth: 'big', tilt: 5 * w * k, y: -3 * Math.abs(w) * k, sy: 1 + 0.02 * w * k }; } },
    deadpan: { dur: 2, pose: t => { const k = ease(seg(t, 0, 0.3)) * (1 - ease(seg(t, 1.7, 2))); return { ...base(), eyes: k > 0.4 ? 'lid' : 'oval', mouth: k > 0.4 ? 'line' : 'curve', edx: 2 * k * Math.sin(2 * Math.PI * seg(t, 0.4, 1.6)), tilt: 2 * k }; } },
  };


  // ---------- expressive moods: anticipation, overshoot, follow-through ----------
  const lerp = (a, b, k) => a + (b - a) * k;
  const wob = (t, hz) => Math.sin(2 * Math.PI * hz * t);
  // One hop: crouch (anticipation), stretch in the air, squash on landing with a spring. k runs 0..1.
  function hop(k, h) {
    if (k < 0.2) { const a = ease(k / 0.2); return { y: 0, sy: 1 - 0.16 * a, sx: 1 + 0.12 * a, air: 0 }; }
    if (k < 0.7) {
      const a = (k - 0.2) / 0.5, s = arcUp(a);
      const sy = lerp(0.84, 1, ease(Math.min(1, a * 3))) + 0.14 * s;
      return { y: -h * s, sy, sx: 1 + (1 - sy) * 0.7, air: s };
    }
    const a = (k - 0.7) / 0.3, sy = 1 - 0.2 * (1 - settle(a));
    return { y: 0, sy, sx: 1 + (1 - sy) * 0.8, air: 0 };
  }
  const MOODS = {
    idle: { dur: 3, pose: t => ({ ...base(), sy: 1 + 0.025 * wob(t, 1 / 3), sx: 1 - 0.012 * wob(t, 1 / 3),
      tilt: 1.2 * wob(t, 1 / 3), x: 1.6 * wob(t, 1 / 3), edx: 1.3 * Math.sin(2 * Math.PI * t / 3 + 1), footL: 0.6 * Math.max(0, wob(t, 1 / 3)) }) },
    hello: { dur: 2.4, pose: t => {
      const p = { ...base(), eyes: 'arc', mouth: 'big' }, h = hop(seg(t, 0, 0.8), 30);
      p.y = h.y; p.sy = h.sy; p.sx = h.sx;
      const up = ease(seg(t, 0.35, 0.7)) * (1 - ease(seg(t, 2.0, 2.4)));
      p.armR = 20 + 38 * up + 26 * up * wob(t - 0.7, 3.2);
      p.armL = up > 0.2 ? -14 + 7 * wob(t, 3.2 + 0.4) : null;
      p.tilt = -6 * up + 2 * up * wob(t, 3.2); p.x = 3 * up;
      if (t < 0.2) { p.eyes = 'oval'; p.mouth = 'curve'; }
      return p; } },
    think: { dur: 2.8, pose: t => {
      const k = ease(seg(t, 0, 0.45)) * (1 - ease(seg(t, 2.3, 2.8)));
      const look = wob(t, 0.9);
      return { ...base(), edx: (-3 + 1.6 * look) * k, edy: -4 * k, mouth: k > 0.3 ? 'line' : 'curve', mdx: 3.5 * k,
        tilt: (-8 + 2.5 * wob(t, 0.7)) * k, sy: 1 + 0.015 * wob(t, 1.4) * k, y: -1.5 * k * Math.abs(wob(t, 0.45)) }; } },
    success: { dur: 2.4, pose: t => {
      const p = { ...base(), eyes: 'arc', mouth: 'big' };
      if (t < 1.5) {
        const h = hop(seg(t, 0, 1.5), 74); p.y = h.y; p.sy = h.sy; p.sx = h.sx;
        const air = h.air; p.tilt = 360 * ease(seg(t, 0.4, 1.0));
        if (t > 0.3) { p.armL = -40 - 18 * air; p.armR = 40 + 18 * air; p.footL = 4 * air; p.footR = 4 * air; }
        if (t < 0.3) { p.eyes = 'oval'; p.mouth = 'curve'; }
      } else {
        const h = hop(seg(t, 1.5, 2.4), 18); p.y = h.y; p.sy = h.sy; p.sx = h.sx; p.armL = -30; p.armR = 30;
      }
      return p; } },
    loading: { dur: 1.6, pose: t => {
      const h = hop(seg(t % 0.8, 0, 0.8), 16), look = Math.floor(t / 0.8) % 2 ? 1 : -1;
      return { ...base(), mouth: 'line', y: h.y, sy: h.sy, sx: h.sx, edx: 2.4 * look * ease(seg(t % 0.8, 0.1, 0.4)), edy: -1 * h.air, tilt: 3 * look * h.air }; } },
    sleepy: { dur: 3.4, pose: t => {
      const p = { ...base(), mouth: 'o' };
      const d1 = ease(seg(t, 0, 1.5)), jerk = seg(t, 1.5, 1.7), d2 = ease(seg(t, 1.9, 3.1)), up = jerk > 0 && t < 1.9;
      const droop = t < 1.5 ? d1 : t < 1.9 ? 1 - jerk : d2;
      p.eyes = droop > 0.55 ? 'line' : 'oval'; p.blink = 1 - 0.55 * droop;
      p.tilt = 13 * droop; p.sy = 1 - 0.07 * droop + 0.025 * wob(t, 0.8) * droop; p.sx = 1 + 0.05 * droop; p.edy = 2 * droop;
      if (up) { p.eyes = 'oval'; p.blink = 1.3; p.mouth = 'o'; p.y = -7 * arcUp(jerk); p.tilt = -5 * jerk * (1 - jerk) * 4; p.armL = -30; p.armR = 30; }
      if (t > 3.1) { const k = ease(seg(t, 3.1, 3.4)); p.tilt *= 1 - k; p.sy = lerp(p.sy, 1, k); p.sx = lerp(p.sx, 1, k); p.eyes = 'oval'; p.blink = lerp(p.blink, 1, k); }
      return p; } },
    surprised: { dur: 2.0, pose: t => {
      const p = { ...base(), mouth: 'o' };
      if (t < 0.5) {
        const k = seg(t, 0, 0.5), a = arcUp(Math.min(1, k * 1.6));
        p.y = -26 * a * (1 - ease(seg(k, 0.55, 1))); p.sy = 1 + 0.16 * a - (k > 0.6 ? 0.18 * (1 - settle(seg(k, 0.6, 1))) : 0);
        p.sx = 1 + (1 - p.sy) * 0.8; p.blink = 1 + 0.35 * ease(seg(t, 0, 0.12)); p.armL = -50; p.armR = 50; p.footL = 3 * a; p.footR = 3 * a;
      } else {
        const k = (1 - ease(seg(t, 1.5, 2.0)));
        p.blink = 1 + 0.35 * k; p.armL = -50 * k - 8; p.armR = 50 * k + 8; p.tilt = 1.4 * wob(t, 14) * k; p.sy = 1.03 * k + (1 - k);
        if (k < 0.15) { p.armL = null; p.armR = null; }
      }
      return p; } },
    proud: { dur: 2.6, pose: t => {
      const k = ease(seg(t, 0, 0.6)) * (1 - ease(seg(t, 2.1, 2.6)));
      return { ...base(), eyes: k > 0.35 ? 'arc' : 'oval', mouth: 'big', tilt: (4 + 1.4 * wob(t, 0.8)) * k, sy: 1 + 0.07 * k, sx: 1 - 0.02 * k,
        y: -5 * k - 2 * k * Math.abs(wob(t, 0.8)), armL: k > 0.3 ? -72 : null, armR: k > 0.3 ? 72 : null, footL: 1.2 * k, footR: 1.2 * k, x: 3 * k * wob(t, 0.4) }; } },
    shy: { dur: 2.8, pose: t => {
      const k = ease(seg(t, 0, 0.5)) * (1 - ease(seg(t, 2.3, 2.8)));
      return { ...base(), edx: -3.2 * k, edy: 3 * k + 0.6 * k * wob(t, 1.2), mouth: k > 0.4 ? 'line' : 'curve', mdx: -1.5 * k,
        tilt: (10 + 2 * wob(t, 0.9)) * k, sx: 1 - 0.07 * k, sy: 1 - 0.04 * k, x: -5 * k, footL: 3 * k * Math.max(0, wob(t, 1.6)), footR: 0 }; } },
    sad: { dur: 3.2, pose: t => {
      const k = ease(seg(t, 0, 0.7)) * (1 - ease(seg(t, 2.6, 3.2)));
      const sigh = Math.exp(-Math.pow((t - 1.8) / 0.35, 2));
      return { ...base(), blink: 1 - 0.25 * k, edy: 3 * k + 1.5 * sigh, mouth: k > 0.4 ? 'frown' : 'curve', tilt: -4 * k, sy: 1 - 0.09 * k - 0.04 * sigh, sx: 1 + 0.05 * k + 0.03 * sigh, y: 1.5 * k }; } },
    excited: { dur: 2.4, pose: t => {
      const h = hop(seg(t % 0.6, 0, 0.6), 30), n = Math.floor(t / 0.6) % 2 ? 1 : -1;
      return { ...base(), eyes: 'arc', mouth: 'big', y: h.y, sy: h.sy, sx: h.sx, armL: -20 - 45 * (n > 0 ? h.air : 0.3), armR: 20 + 45 * (n < 0 ? h.air : 0.3),
        footL: 4 * h.air, footR: 4 * h.air, tilt: 5 * n * h.air, x: 4 * n * h.air }; } },
    wink: { dur: 2.0, pose: t => {
      const lean = ease(seg(t, 0, 0.25)), snap = seg(t, 0.25, 0.4), rel = ease(seg(t, 1.5, 2.0));
      const k = (1 - rel), p = { ...base(), mouth: 'big' };
      if (t < 0.25) { p.tilt = -4 * lean; p.sy = 1 + 0.04 * lean; p.eyes = 'oval'; p.mouth = 'curve'; }
      else { p.eyes = rel < 0.6 ? ['arc', 'oval'] : 'oval'; p.tilt = lerp(-4, 9, ease(snap)) * k; p.y = -4 * arcUp(snap * 1.2) * k; p.sy = 1 + 0.03 * k; p.armR = 55 * k; }
      return p; } },
    laugh: { dur: 2.6, pose: t => {
      const k = Math.min(ease(seg(t, 0, 0.3)), 1 - ease(seg(t, 2.1, 2.6))), w = wob(t, 6.5);
      return { ...base(), eyes: 'arc', mouth: 'big', tilt: 7 * w * k, y: -7 * Math.abs(w) * k, sy: 1 + 0.05 * w * k, sx: 1 - 0.03 * w * k,
        armL: -30 - 22 * wob(t, 6.5) * k, armR: 30 + 22 * wob(t + 0.08, 6.5) * k, x: 2 * w * k }; } },
    deadpan: { dur: 2.8, pose: t => {
      const k = ease(seg(t, 0, 0.35)) * (1 - ease(seg(t, 2.4, 2.8)));
      const p = { ...base(), eyes: k > 0.4 ? 'lid' : 'oval', mouth: k > 0.4 ? 'line' : 'curve', tilt: 2 * k, sy: 1 - 0.02 * k };
      p.edx = 3.2 * k * (ease(seg(t, 0.6, 1.1)) * 2 - 1 - ease(seg(t, 1.9, 2.3)));
      if (t > 1.45 && t < 1.65) p.blink = 0.15;
      return p; } },
    scared: { dur: 2.0, pose: t => {
      const k = ease(seg(t, 0, 0.12)) * (1 - ease(seg(t, 1.6, 2.0)));
      return { ...base(), blink: 1 + 0.3 * k, mouth: k > 0.3 ? 'wavy' : 'curve', x: 2.4 * wob(t, 22) * k - 3 * k, tilt: -7 * k, sy: 1 - 0.06 * k, sx: 1 + 0.04 * k,
        footL: 3 * k, footR: 3 * k, armL: k > 0.3 ? -22 : null, armR: k > 0.3 ? 22 : null, y: -4 * k * Math.abs(wob(t, 11)) }; } },
    dance: { dur: 3.2, pose: t => {
      const beat = (t % 0.4) / 0.4, n = Math.floor(t / 0.4) % 2 ? 1 : -1, a = arcUp(beat);
      return { ...base(), eyes: 'arc', mouth: 'big', y: -12 * a, sy: 1 + 0.05 * a - (beat < 0.12 ? 0.06 : 0), tilt: 11 * n * ease(Math.min(1, beat * 2.2)),
        x: 9 * n * (1 - Math.abs(beat - 0.5) * 0.4), armL: -30 - 40 * (n > 0 ? a : 0), armR: 30 + 40 * (n < 0 ? a : 0), footL: 3 * (n > 0 ? a : 0), footR: 3 * (n < 0 ? a : 0) }; } },
    annoyed: { dur: 2.4, pose: t => {
      const k = ease(seg(t, 0, 0.25)) * (1 - ease(seg(t, 2.0, 2.4)));
      const stomp = Math.max(0, wob(t, 2.2));
      return { ...base(), eyes: k > 0.4 ? 'lid' : 'oval', mouth: k > 0.4 ? 'frown' : 'curve', sx: 1 - 0.04 * k + 0.02 * stomp * k, sy: 1 + 0.04 * k - 0.04 * stomp * k,
        tilt: 2.5 * wob(t, 2.2) * k, footL: 4 * Math.max(0, wob(t, 1.1)) * k, footR: 4 * Math.max(0, -wob(t, 1.1)) * k, y: 2 * stomp * k }; } },
  };
  Object.assign(ACTIONS, MOODS);

  // Blinks happen on top of any open-eyed pose: 120 ms, at the given times.
  function withBlink(p, t, times) {
    for (const b of times) { const d = t - b; if (d >= 0 && d < 0.14) p.blink = Math.min(p.blink, Math.abs(d - 0.07) / 0.07 * 0.9 + 0.1); }
    return p;
  }

  // The showreel used for the export: idle, hello, think, success, loading, sleepy, idle.
  const REEL = ['idle', 'hello', 'think', 'success', 'loading', 'sleepy', 'idle'];
  const REEL_BLINKS = [1.2, 4.1, 7.9, 12.6];
  const reelDur = REEL.reduce((s, a) => s + ACTIONS[a].dur, 0);
  function reelPose(t) {
    let acc = 0;
    for (const a of REEL) { const d = ACTIONS[a].dur; if (t < acc + d) return withBlink(ACTIONS[a].pose(t - acc), t, REEL_BLINKS); acc += d; }
    return base();
  }

    // ---------- smoothing ----------
  // A rig sits between the animation and the renderer. It keeps one continuous state, so every number glides
  // (critically damped springs), arms retract instead of popping, and eyes and mouths crossfade between shapes.
  // This also hides the seam when one action hands over to another.
  function makeRig() {
    const cur = {}, vel = {}, last = { armL: 0, armR: 0 }, kind = {}, prev = {}, fade = {};
    const TAU = { y: .06, x: .07, tilt: .07, sx: .05, sy: .05, edx: .05, edy: .05, mdx: .06, footL: .05, footR: .05, blink: .03, armL: .06, armR: .06, armLa: .08, armRa: .08 };
    const damp = (k, target, dt) => {                       // SmoothDamp (critically damped spring)
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
    function step(p, dt) {
      dt = Math.max(0.001, Math.min(0.05, dt));
      const out = { ...p };
      if (p.pie) return out;                                  // the pie is a hard cut: hold the state
      for (const k of ['y', 'x', 'sx', 'sy', 'edx', 'edy', 'mdx', 'footL', 'footR', 'blink']) out[k] = damp(k, p[k] == null ? (k === 'sx' || k === 'sy' || k === 'blink' ? 1 : 0) : p[k], dt);
      if (cur.tilt != null) cur.tilt = wrap(cur.tilt);        // spins stay continuous across 360
      out.tilt = damp('tilt', (cur.tilt == null ? 0 : cur.tilt) + (p.tilt == null ? 0 : wrap((p.tilt || 0) - (cur.tilt || 0))), dt);
      for (const side of ['armL', 'armR']) {
        const want = p[side] != null, key = side + 'a', was = cur[key] == null ? 0 : cur[key];
        if (want) { if (was < 0.05) { cur[side] = p[side]; vel[side] = 0; } last[side] = p[side]; }
        const pres = damp(key, want ? 1 : 0, dt), ang = damp(side, last[side], dt);
        out[side] = pres > 0.02 ? ang : null; out[key] = Math.min(1, pres);
      }
      const et = Array.isArray(p.eyes) ? p.eyes : [p.eyes, p.eyes];
      track('e0', et[0], dt); track('e1', et[1], dt); track('m', p.mouth, dt);
      out.eyes = [kind.e0, kind.e1]; out.eyesPrev = [prev.e0, prev.e1]; out.eyeFade = [fade.e0, fade.e1];
      out.mouth = kind.m; out.mouthPrev = prev.m; out.mouthFade = fade.m;
      return out;
    }
    return { step };
  }

  const api = { makeRig, render, ACTIONS, withBlink, base, REEL, reelDur, reelPose, C };
  if (typeof module !== 'undefined') module.exports = api; else root.Buddy = api;
})(this);
