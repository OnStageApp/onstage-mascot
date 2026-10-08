#!/usr/bin/env python3
"""Compare two folders of PNGs with the same file names (PIL + numpy).

Usage:
  python3 tests/parity/compare.py --a tests/parity/web --b path/to/flutter/pngs \
      [--manifest tests/parity/web/manifest.json] [--tol-max 48] [--tol-mean 0.5] \
      [--tol-pixels 0.01] [--pixel-threshold 32] [--report tests/parity/report] [--diffs failing|all|none]

A file passes when all of these hold:
  max channel difference      <= --tol-max      (0..255)
  mean channel difference     <= --tol-mean     (0..255, averaged over all pixels and RGB)
  share of pixels whose max channel difference exceeds --pixel-threshold <= --tol-pixels (0..1)
Images are composited on white if they have alpha, and must have the same size.
Writes report.json, report.md and, for --diffs, <name>-diff.png (difference x4, grey where equal).
Exit code 1 when any file fails or is missing.
"""
import argparse, json, os, sys
import numpy as np
from PIL import Image


def load(path):
    im = Image.open(path)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
        im = Image.alpha_composite(bg, im)
    return np.asarray(im.convert('RGB')).astype(np.int16)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--a', required=True, help='reference folder (web)')
    ap.add_argument('--b', required=True, help='candidate folder (for example Flutter)')
    ap.add_argument('--manifest', help='manifest.json listing the files; default: every PNG in --a')
    ap.add_argument('--tol-max', type=float, default=48)
    ap.add_argument('--tol-mean', type=float, default=0.5)
    ap.add_argument('--tol-pixels', type=float, default=0.01)
    ap.add_argument('--pixel-threshold', type=float, default=32)
    ap.add_argument('--report', default=None)
    ap.add_argument('--diffs', choices=['failing', 'all', 'none'], default='failing')
    o = ap.parse_args()

    if o.manifest:
        names = [c['file'] for c in json.load(open(o.manifest))['cases']]
    else:
        names = sorted(f for f in os.listdir(o.a) if f.endswith('.png'))
    report_dir = o.report
    if report_dir:
        os.makedirs(report_dir, exist_ok=True)

    rows, failed = [], 0
    for name in names:
        pa, pb = os.path.join(o.a, name), os.path.join(o.b, name)
        if not os.path.exists(pa) or not os.path.exists(pb):
            rows.append({'file': name, 'ok': False, 'error': 'missing in ' + ('a' if not os.path.exists(pa) else 'b')})
            failed += 1
            continue
        a, b = load(pa), load(pb)
        if a.shape != b.shape:
            rows.append({'file': name, 'ok': False, 'error': f'size {a.shape[1]}x{a.shape[0]} vs {b.shape[1]}x{b.shape[0]}'})
            failed += 1
            continue
        d = np.abs(a - b)
        dmax = int(d.max())
        dmean = float(d.mean())
        share = float((d.max(axis=2) > o.pixel_threshold).mean())
        ok = dmax <= o.tol_max and dmean <= o.tol_mean and share <= o.tol_pixels
        failed += 0 if ok else 1
        rows.append({'file': name, 'ok': ok, 'max': dmax, 'mean': round(dmean, 5), 'pixelsOver': round(share, 6)})
        if report_dir and (o.diffs == 'all' or (o.diffs == 'failing' and not ok)):
            vis = np.clip(128 + (b - a) * 4, 0, 255).astype(np.uint8)
            Image.fromarray(vis).save(os.path.join(report_dir, name[:-4] + '-diff.png'))

    measured = [r for r in rows if 'max' in r]
    summary = {
        'files': len(rows), 'failed': failed,
        'max': max((r['max'] for r in measured), default=None),
        'meanOfMeans': round(float(np.mean([r['mean'] for r in measured])), 6) if measured else None,
        'worstMean': max((r['mean'] for r in measured), default=None),
        'tolerance': {'max': o.tol_max, 'mean': o.tol_mean, 'pixels': o.tol_pixels, 'pixelThreshold': o.pixel_threshold},
    }
    if report_dir:
        json.dump({'summary': summary, 'rows': rows}, open(os.path.join(report_dir, 'report.json'), 'w'), indent=1)
        with open(os.path.join(report_dir, 'report.md'), 'w') as f:
            f.write(f"# Parity report\n\n{summary['files']} files, {failed} failing. Max {summary['max']}, mean of means {summary['meanOfMeans']}.\n\n")
            f.write('| file | ok | max | mean | pixels over |\n|---|---|---|---|---|\n')
            for r in sorted(rows, key=lambda r: (r['ok'], -r.get('max', 999))):
                f.write(f"| {r['file']} | {'yes' if r['ok'] else 'NO'} | {r.get('max', r.get('error'))} | {r.get('mean', '')} | {r.get('pixelsOver', '')} |\n")
    print(json.dumps(summary))
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
