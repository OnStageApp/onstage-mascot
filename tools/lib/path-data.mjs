// SVG path data normaliser. Turns any path `d` into absolute M, L, C and Z only, so a player needs
// nothing beyond moveTo, lineTo, cubicTo and close. Quadratics become exact cubics; elliptical arcs
// become cubics of at most 90 degrees each (error well under 0.01 units at these sizes).

const NUM = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;

export function tokenize(d) {
  const out = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)/g;
  let m;
  while ((m = re.exec(d))) out.push(m[1] ? m[1] : +m[2]);
  return out;
}

const ARGS = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

// Returns a list of segments: ['M', x, y] | ['L', x, y] | ['C', x1, y1, x2, y2, x, y] | ['Z']
export function normalise(d) {
  const tk = tokenize(d);
  const segs = [];
  let i = 0, cmd = null, x = 0, y = 0, sx = 0, sy = 0;
  let lastC = null, lastQ = null; // reflected control points for S and T
  while (i < tk.length) {
    if (typeof tk[i] === 'string') cmd = tk[i++];
    else if (cmd == null) throw new Error('path data starts with a number: ' + d);
    const up = cmd.toUpperCase(), rel = cmd !== up, n = ARGS[up];
    const a = tk.slice(i, i + n);
    if (a.length < n || a.some(v => typeof v !== 'number')) throw new Error(`bad args for ${cmd} in ${d}`);
    i += n;
    const ox = rel ? x : 0, oy = rel ? y : 0;
    switch (up) {
      case 'M':
        x = a[0] + ox; y = a[1] + oy; sx = x; sy = y; segs.push(['M', x, y]);
        lastC = lastQ = null; cmd = rel ? 'l' : 'L'; break; // implicit lineto after moveto
      case 'L': x = a[0] + ox; y = a[1] + oy; segs.push(['L', x, y]); lastC = lastQ = null; break;
      case 'H': x = a[0] + (rel ? x : 0); segs.push(['L', x, y]); lastC = lastQ = null; break;
      case 'V': y = a[0] + (rel ? y : 0); segs.push(['L', x, y]); lastC = lastQ = null; break;
      case 'C': {
        const c = [a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy, a[4] + ox, a[5] + oy];
        segs.push(['C', ...c]); lastC = [c[2], c[3]]; lastQ = null; x = c[4]; y = c[5]; break;
      }
      case 'S': {
        const r = lastC ? [2 * x - lastC[0], 2 * y - lastC[1]] : [x, y];
        const c = [r[0], r[1], a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy];
        segs.push(['C', ...c]); lastC = [c[2], c[3]]; lastQ = null; x = c[4]; y = c[5]; break;
      }
      case 'Q': {
        const q = [a[0] + ox, a[1] + oy], e = [a[2] + ox, a[3] + oy];
        segs.push(quadToCubic(x, y, q, e)); lastQ = q; lastC = null; x = e[0]; y = e[1]; break;
      }
      case 'T': {
        const q = lastQ ? [2 * x - lastQ[0], 2 * y - lastQ[1]] : [x, y], e = [a[0] + ox, a[1] + oy];
        segs.push(quadToCubic(x, y, q, e)); lastQ = q; lastC = null; x = e[0]; y = e[1]; break;
      }
      case 'A': {
        const e = [a[5] + ox, a[6] + oy];
        for (const s of arcToCubics(x, y, a[0], a[1], a[2], a[3], a[4], e[0], e[1])) segs.push(s);
        x = e[0]; y = e[1]; lastC = lastQ = null; break;
      }
      case 'Z': segs.push(['Z']); x = sx; y = sy; lastC = lastQ = null; break;
    }
  }
  return segs;
}

function quadToCubic(x0, y0, q, e) {
  return ['C', x0 + 2 / 3 * (q[0] - x0), y0 + 2 / 3 * (q[1] - y0), e[0] + 2 / 3 * (q[0] - e[0]), e[1] + 2 / 3 * (q[1] - e[1]), e[0], e[1]];
}

// SVG 1.1 F.6.5 endpoint to centre conversion, then one cubic per <= 90 degree piece.
export function arcToCubics(x1, y1, rx, ry, phiDeg, fa, fs, x2, y2) {
  if (x1 === x2 && y1 === y2) return [];
  rx = Math.abs(rx); ry = Math.abs(ry);
  if (rx === 0 || ry === 0) return [['L', x2, y2]];
  const phi = phiDeg * Math.PI / 180, cp = Math.cos(phi), sp = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy;
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lam > 1) { const s = Math.sqrt(lam); rx *= s; ry *= s; }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  let co = Math.sqrt(Math.max(0, num / den));
  if (fa === fs) co = -co;
  const cxp = co * (rx * y1p / ry), cyp = co * (-ry * x1p / rx);
  const cx = cp * cxp - sp * cyp + (x1 + x2) / 2, cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx, vy) => { const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); return a; };
  const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!fs && dt > 0) dt -= 2 * Math.PI; else if (fs && dt < 0) dt += 2 * Math.PI;
  const n = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-9));
  const step = dt / n, k = 4 / 3 * Math.tan(step / 4);
  const pt = t => [cx + rx * Math.cos(t) * cp - ry * Math.sin(t) * sp, cy + rx * Math.cos(t) * sp + ry * Math.sin(t) * cp];
  const der = t => [-rx * Math.sin(t) * cp - ry * Math.cos(t) * sp, -rx * Math.sin(t) * sp + ry * Math.cos(t) * cp];
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = t1 + i * step, b = a + step;
    const p0 = pt(a), p3 = i === n - 1 ? [x2, y2] : pt(b), d0 = der(a), d3 = der(b);
    out.push(['C', p0[0] + k * d0[0], p0[1] + k * d0[1], p3[0] - k * d3[0], p3[1] - k * d3[1], p3[0], p3[1]]);
  }
  return out;
}

export const fmt = v => {
  const r = Math.round(v * 1000) / 1000;
  return Object.is(r, -0) ? '0' : String(r);
};

export function toD(segs) {
  return segs.map(s => s[0] + s.slice(1).map(fmt).join(' ')).join('');
}

export const normaliseD = d => toD(normalise(d));
export { NUM };
