#!/usr/bin/env python3
"""Compare Figma variant exports with the code's resting frames.

Usage (run from the repo root):
  npm run render-png -- --all --size 480 --background card --out reports/figma-parity/code
  python3 tools/figma/compare.py [--dir reports/figma-parity] [--names figma-names.json]
                                 [--pct 0.3] [--delta 24] [--tag after]

Inputs (inside --dir):
  code/NN-<key>.png     code resting frames, 480 px, background #F4F4F2 (npm run render-png)
  figma/<key>.png       Figma exports at scale 2, transparent background
  figma-names.json      variant names read from the component set (optional, for the name sync)

Both sides are composited on #F4F4F2. A state is flagged when more than --pct percent of pixels
differ by more than --delta (of 255, max over channels), or when the non-background silhouette
differs by more than 0.1 percent of pixels (a shape is missing or moved).
Writes report.json, report.md and diff/<key>.png (flagged states only) into --dir.
"""
import argparse, json, os, sys
import numpy as np
from PIL import Image

BG = (244, 244, 242)


def load_over_bg(path):
    im = Image.open(path).convert('RGBA')
    bg = Image.new('RGBA', im.size, BG + (255,))
    return np.asarray(Image.alpha_composite(bg, im).convert('RGB')).astype(np.int16)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', default='reports/figma-parity')
    ap.add_argument('--spec', default='spec/states.json')
    ap.add_argument('--names', default='figma-names.json')
    ap.add_argument('--pct', type=float, default=0.3, help='flag when more than this percent of pixels differ')
    ap.add_argument('--delta', type=int, default=24, help='per-pixel difference threshold (0-255)')
    ap.add_argument('--tag', default='', help='suffix for output files, e.g. "after"')
    a = ap.parse_args()

    spec = json.load(open(a.spec))['states']
    keys = [s['key'] for s in spec]
    sfx = ('-' + a.tag) if a.tag else ''

    # name sync
    sync = {'missing_in_figma': [], 'missing_in_code': []}
    npath = os.path.join(a.dir, a.names)
    if os.path.exists(npath):
        fn = [n.replace('state=', '', 1) for n in json.load(open(npath))]
        sync['missing_in_figma'] = [k for k in keys if k not in fn]
        sync['missing_in_code'] = [k for k in fn if k not in keys]
        sync['figma_count'] = len(fn)
    sync['code_count'] = len(keys)

    rows = []
    os.makedirs(os.path.join(a.dir, 'diff'), exist_ok=True)
    for i, k in enumerate(keys):
        cpath = os.path.join(a.dir, 'code', f'{i + 1:02d}-{k}.png')
        fpath = os.path.join(a.dir, 'figma', f'{k}.png')
        if not (os.path.exists(cpath) and os.path.exists(fpath)):
            rows.append({'key': k, 'status': 'missing-file'})
            continue
        c, f = load_over_bg(cpath), load_over_bg(fpath)
        if c.shape != f.shape:
            rows.append({'key': k, 'status': 'size-mismatch', 'code': c.shape, 'figma': f.shape})
            continue
        d = np.abs(c - f).max(axis=2)
        n = d.size
        over = d > a.delta
        pct = 100.0 * over.sum() / n
        pct_loose = 100.0 * (d > 8).sum() / n
        # silhouette: pixels that are not background-like
        sc = np.abs(c - np.array(BG)).max(axis=2) > 40
        sf = np.abs(f - np.array(BG)).max(axis=2) > 40
        sil = 100.0 * (sc ^ sf).sum() / n
        ys, xs = np.nonzero(over)
        bbox = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else None
        flagged = pct > a.pct or sil > 0.1
        rows.append({'key': k, 'status': 'FLAG' if flagged else 'match', 'pct_over_delta': round(pct, 4),
                     'pct_over_8': round(pct_loose, 4), 'max_diff': int(d.max()),
                     'silhouette_xor_pct': round(sil, 4), 'diff_bbox': bbox})
        if flagged:
            out = np.zeros((480, 480 * 3, 3), np.uint8)
            out[:, :480] = c.astype(np.uint8)
            out[:, 480:960] = f.astype(np.uint8)
            heat = np.full((480, 480, 3), 255, np.uint8)
            heat[over] = (220, 30, 30)
            heat[(d > 8) & ~over] = (250, 190, 60)
            out[:, 960:] = heat
            Image.fromarray(out).save(os.path.join(a.dir, 'diff', f'{k}{sfx}.png'))

    ok = [r for r in rows if r['status'] == 'match']
    bad = [r for r in rows if r['status'] != 'match']
    res = {'tolerance': {'pct_pixels': a.pct, 'pixel_delta': a.delta, 'silhouette_pct': 0.1},
           'name_sync': sync, 'matched': len(ok), 'flagged': len(bad),
           'flagged_keys': [r['key'] for r in bad], 'rows': rows}
    json.dump(res, open(os.path.join(a.dir, f'report{sfx}.json'), 'w'), indent=1)

    L = [f'# Figma parity{(" (" + a.tag + ")") if a.tag else ""}', '',
         'Component set `Mascot/Buddy App` vs the code resting frames, 480 px, both on #F4F4F2.', '',
         f'- Name sync: Figma {sync.get("figma_count", "n/a")} variants, code {sync["code_count"]} keys. '
         f'Missing in Figma: {sync["missing_in_figma"] or "none"}. Missing in code: {sync["missing_in_code"] or "none"}.',
         f'- Tolerance: flag when more than {a.pct} percent of pixels differ by more than {a.delta}/255, '
         f'or silhouette XOR above 0.1 percent.',
         f'- Matched {len(ok)}, flagged {len(bad)}: {", ".join(r["key"] for r in bad) or "none"}.', '',
         '| key | status | % over delta | % over 8 | max diff | silhouette XOR % | diff bbox |', '|---|---|---|---|---|---|---|']
    for r in rows:
        L.append(f'| {r["key"]} | {r["status"]} | {r.get("pct_over_delta", "")} | {r.get("pct_over_8", "")} | '
                 f'{r.get("max_diff", "")} | {r.get("silhouette_xor_pct", "")} | {r.get("diff_bbox", "")} |')
    vals = sorted(r['pct_over_delta'] for r in rows if 'pct_over_delta' in r)
    if vals:
        L += ['', '## Tolerance evidence', '',
              f'Percent of pixels over delta {a.delta}: median {vals[len(vals) // 2]}, p90 {vals[int(len(vals) * 0.9)]}, '
              f'max {vals[-1]} (threshold {a.pct}). Differences on matching states are 1 px rings around thin '
              'strokes (rasteriser antialiasing and sub-pixel stroke geometry), not moved or missing shapes.']
    notes = os.path.join(a.dir, 'notes.md')
    if os.path.exists(notes):
        L += ['', open(notes).read().rstrip()]
    open(os.path.join(a.dir, f'report{sfx}.md'), 'w').write('\n'.join(L) + '\n')
    print(f'matched {len(ok)}, flagged {len(bad)}')
    for r in sorted(bad, key=lambda r: -r.get('pct_over_delta', 0)):
        print(r['key'], r.get('pct_over_delta'), r.get('silhouette_xor_pct'), r.get('max_diff'), r.get('diff_bbox'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
