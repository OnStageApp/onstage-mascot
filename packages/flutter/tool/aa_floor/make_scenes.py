#!/usr/bin/env python3
"""The anti-aliasing floor: how far two rasterisers disagree on geometry that is identical by
construction. Writes 40 scenes of plain shapes (circles, stroked rings, ellipses, rotated rounded
rects with clamped radii, round-capped quadratic strokes; navy on card at 480 px) to
tests/parity/out/flutter/aa-floor/: scenes.json and web/NN.png (rsvg-convert).
aa_floor_test.dart paints the same scenes with Flutter into flutter/NN.png. Run via run.sh."""
import json, os, random, subprocess, sys

root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
out = os.path.join(root, 'tests', 'parity', 'out', 'flutter', 'aa-floor')
rsvg = os.environ.get('RSVG_CONVERT', '/opt/homebrew/bin/rsvg-convert')
os.makedirs(os.path.join(out, 'web'), exist_ok=True)
random.seed(3)
scenes = []
for i in range(40):
    shapes = []
    for j in range(6):
        k = random.choice(['circle', 'ring', 'ellipse', 'rrect', 'quad'])
        x, y = random.uniform(30, 210), random.uniform(30, 210)
        if k == 'circle':
            shapes.append({'k': k, 'x': x, 'y': y, 'r': random.uniform(2, 30)})
        elif k == 'ring':
            shapes.append({'k': k, 'x': x, 'y': y, 'r': random.uniform(5, 30), 'w': random.uniform(1.5, 5)})
        elif k == 'ellipse':
            shapes.append({'k': k, 'x': x, 'y': y, 'rx': random.uniform(2, 25), 'ry': random.uniform(2, 25)})
        elif k == 'rrect':
            w, h = random.uniform(5, 40), random.uniform(5, 40)
            r = min(random.uniform(1, 5), w / 2, h / 2)  # SVG and Flutter clamp radii differently
            shapes.append({'k': k, 'x': x, 'y': y, 'w': w, 'h': h, 'r': r, 'a': random.uniform(-40, 40)})
        else:
            shapes.append({'k': k, 'x': x, 'y': y, 'dx': random.uniform(5, 25), 'dy': random.uniform(-15, 15), 'w': random.uniform(2, 5)})
    scenes.append(shapes)
json.dump(scenes, open(os.path.join(out, 'scenes.json'), 'w'))
for i, sh in enumerate(scenes):
    s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="480" height="480"><rect width="240" height="240" fill="#F4F4F2"/>'
    for o in sh:
        k = o['k']
        if k == 'circle':
            s += f'<circle cx="{o["x"]}" cy="{o["y"]}" r="{o["r"]}" fill="#00275C"/>'
        elif k == 'ring':
            s += f'<circle cx="{o["x"]}" cy="{o["y"]}" r="{o["r"]}" fill="none" stroke="#00275C" stroke-width="{o["w"]}"/>'
        elif k == 'ellipse':
            s += f'<ellipse cx="{o["x"]}" cy="{o["y"]}" rx="{o["rx"]}" ry="{o["ry"]}" fill="#00275C"/>'
        elif k == 'rrect':
            s += f'<rect x="{o["x"]}" y="{o["y"]}" width="{o["w"]}" height="{o["h"]}" rx="{o["r"]}" ry="{o["r"]}" fill="#00275C" transform="rotate({o["a"]} {o["x"]} {o["y"]})"/>'
        else:
            s += f'<path d="M{o["x"]} {o["y"]}Q{o["x"] + o["dx"] / 2} {o["y"] + o["dy"]} {o["x"] + o["dx"]} {o["y"]}" fill="none" stroke="#00275C" stroke-width="{o["w"]}" stroke-linecap="round" stroke-linejoin="round"/>'
    s += '</svg>'
    subprocess.run([rsvg, '-o', os.path.join(out, 'web', f'{i:02d}.png')], input=s.encode(), check=True)
print(f'wrote {len(scenes)} scenes to {os.path.relpath(out, root)}', file=sys.stderr)
