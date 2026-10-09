# Renderer contract (spec format 1)

This is the exact algorithm every player implements. The web player (`packages/web/src`) is the
reference implementation; a port (Flutter first) must reproduce it step by step. Where this text and
the web code disagree, that is a bug: fix one of them and say which in the commit.

A player is dumb on purpose. It reads `spec/`, picks two frames, interpolates numbers, and draws
rectangles, ellipses, circles and paths. It never runs springs, easing or physics: motion was baked.

Contents: 1 Units and canvas. 2 Data the player reads. 3 Scene drawing. 4 Actor (the character).
5 Props. 6 Paint rules. 7 Sampling a clip. 8 Combining a clip with the rest pose. 9 Player
(phases, blink, idle, reduced motion, pausing). 10 Random source. 11 Parity. 12 Reserved for later.

Pseudocode conventions: angles in degrees unless noted; `rad(a) = a * pi / 180`; `lerp(a, b, k) = a + (b - a) * k`;
`floor` rounds toward negative infinity; `%` on non-negative numbers is the ordinary remainder.

---

## 1. Units and canvas

- **Canvas**: `states.canvas` = 240 by 240 scene units, origin top left, y down. A player maps it to
  its output size with a uniform scale (`size / 240`). Content outside the canvas is clipped.
- **Ground line**: `states.ground` = 196 (scene units). Only the ground shadow uses it.
- **Body units**: the character is drawn in the coordinate space of the logo tile, 64 wide and 54
  tall, origin at the tile's top left. All pose fields are in body units unless they are angles,
  scales or flags.
- An actor has a placement `{ cx, by, s, shadow }`: horizontal centre `cx` and tile bottom `by` in
  scene units, scale `s` (scene units per body unit; 2.2 for a lone Buddy, 1.75 beside a prop).

## 2. Data the player reads

| File | What |
|---|---|
| `spec/palette.json` | `surfaces.light` and `surfaces.dark`: token name to `#RRGGBB` or `null` (null = do not draw). |
| `spec/states.json` | `canvas`, `ground`, `idle`, `blink`, `states[]`. Each state: `key`, `group`, `name`, `use`, `actors[]` (placement plus `rest` pose), `layers[]` (draw order), `motion` (`id`, `plays`, `then`, `actors[]` with `offset`). |
| `spec/motion/<id>.json` | One baked clip: header (`kind`, `fps`, `frames`, `loop`, `introFrames`, `duration`, `fields`, `constants`, `eyeTypes`, `mouthTypes`) and `rows`. |

The Pose record (all numbers are doubles; type fields are strings):

```
x y tilt sx sy                         position offset (body units), tilt (deg), squash/stretch
eyeL eyeR edx edy blink                eye types, eye offset (body units), blink (eye height factor)
mouth mw mdx mdy                       mouth type, width, offset
footL footR footLRot footRRot          foot lift (body units, up is positive), foot rotation (deg)
aL aLx aLy aLang aLlen aLthumb         left arm: presence 0..1, anchor, angle (deg), length, thumb flag
aR aRx aRy aRang aRlen aRthumb         right arm, same
fold badge                             flags (0 or 1): page-fold tile, lanyard clip on the head
eyeLPrev eyeLFade eyeRPrev eyeRFade mouthPrev mouthFade
                                       crossfade state; a rest pose has Prev = null, Fade = 1
```

## 3. Scene drawing

```
drawScene(state, poses[], surface, background?):
  C = palette.surfaces[surface]
  if background: fill the whole canvas with C[background] (or a literal colour)
  for layer in state.layers (in order):
    if layer.type == "actor": drawActor(state.actors[layer.actor], poses[layer.actor], C)
    else: drawPrim(layer, C)
```

The order of `layers` is the z-order. Actors interleave with props (some props sit behind Buddy,
some in front).

## 4. Actor (the character)

### 4.1 Ground shadow (drawn first, in scene units, outside the actor transform)

```
if actor.shadow and C.shadow != null:
  lift = max(0, -P.y)
  ellipse centre (actor.cx + P.x * s, ground + 6.5 * s)
          rx = 27 * s * P.sx / (1 + lift / 30)
          ry = 3.4 * s
          fill C.shadow
```

The shadow does not follow `y` (it stays on the ground) and shrinks as Buddy rises. On the dark
surface the shadow token is null, so nothing is drawn.

### 4.2 Transform

Compose, outermost first (each step applies to everything drawn after it, like nested SVG groups):

```
translate(actor.cx - 32 * s + P.x * s,  actor.by - 54 * s + P.y * s)
scale(s, s)
rotate(P.tilt) about (32, 27)            -- tile centre
translate(32, 54); scale(P.sx, P.sy); translate(-32, -54)   -- squash about the bottom centre
```

`rotate(a) about (px, py)` means `translate(px, py); rotate(a); translate(-px, -py)`. Positive
angles turn clockwise on screen (y down), as in SVG and Flutter's `Canvas.rotate`.

### 4.3 Draw order inside the transform

```
1 foot L   2 foot R   3 arm L (+ thumb)   4 arm R (+ thumb)
5 body (tile, or fold tile + fold corner)
6 eye L    7 eye R    8 mouth   9 badge
```

Colours: feet `C.feet`, arms and thumbs `C.arm`, body `C.body`, everything else (eyes, mouth,
fold corner, badge) `C.navy`.

### 4.4 Feet

```
foot(side):
  lift = side == L ? P.footL : P.footR;  rot = side == L ? P.footLRot : P.footRRot
  x  = side == L ? 13 : 40;  px = side == L ? 18.5 : 45.5
  rounded rect (x, 48 - lift, w 11, h 13, rx 5.5, ry 5.5)
  if rot != 0: rotate it by rot about (px, 50 - lift)
```

### 4.5 Arms (capsules)

```
arm(side):                                   -- skip entirely unless a > 0.02
  a = P.a<side>;  (ax, ay) = (P.a<side>x, P.a<side>y);  ang = P.a<side>ang
  L = P.a<side>len * a                       -- presence scales the length
  rounded rect (ax - 4.5, ay - L, w 9, h L + 4.5, rx 4.5, ry min(4.5, (L + 4.5) / 2))
  rotated by ang about (ax, ay)              -- ang 0 points straight up, positive is clockwise
  if P.a<side>thumb >= 0.5:
    tip = (ax + L * sin(rad(ang)), ay - L * cos(rad(ang)))
    rounded rect (tip.x - 4.5, tip.y - 14, w 9, h 14, rx 4.5, ry 4.5)   -- not rotated
```

The rest-pose arm geometry comes from the generator's arm presets (side, up, out, shrug) converted
to this one capsule form; the motion clips animate the same five numbers.

### 4.6 Body

Plain tile (`fold < 0.5`): a rounded rectangle 64 by 54 at (0, 0) with **per-corner** circular
radii: top left 7, top right 24, bottom right 7, bottom left 24. As a path:

```
M7 0 H40 A24 24 0 0 1 64 24 V47 A7 7 0 0 1 57 54 H24 A24 24 0 0 1 0 30 V7 A7 7 0 0 1 7 0 Z
```

Fold tile (`fold >= 0.5`), fill `C.body`, then the corner, fill `C.navy`:

```
M7 0 H38 L64 26 V47 A7 7 0 0 1 57 54 H24 A24 24 0 0 1 0 30 V7 A7 7 0 0 1 7 0 Z
M38 0 L64 26 H62 A24 24 0 0 0 38 2 Z
```

Every `A r r 0 0 1 x y` above is a quarter circle turning clockwise (Flutter:
`arcToPoint(Offset(x, y), radius: Radius.circular(r), clockwise: true)`); the corner's
`A 24 24 0 0 0 38 2` turns counter-clockwise (`clockwise: false`).

### 4.7 Eyes

Eye centres: left `(19 + P.edx, 25 + P.edy)`, right `(45 + P.edx, 25 + P.edy)`.
`b = P.blink` (already multiplied by the blink factor, section 9). `ink = C.navy`.
"stroke(w)" means: no fill, stroke `ink`, width `w`, round cap, round join.

| type | shape at centre (x, y) |
|---|---|
| `oval` | filled ellipse, centre (x, y), rx 5.2, ry `max(1.9, 7 * b)` |
| `big` | filled ellipse, centre (x, y - 1), rx 5.82, ry `max(1.9, 8.54 * b)` |
| `small` | filled ellipse, centre (x, y), rx 3.4, ry `max(1.9, 4.6 * b)` |
| `lid` | filled lower half ellipse: centre (x, y0) with y0 = y - 0.7, rx 5.2, ry 7, from angle 0 to 180 (through (x, y0 + 7)), closed by the chord. SVG: `M x-5.2 y0 A5.2 7 0 0 0 x+5.2 y0 Z` |
| `slantL` | `lid`, then rotated +14 about (x, y) |
| `slantR` | `lid`, then rotated -14 about (x, y) |
| `arc` | stroke(3.8): M (x-5.5, y+2.4) Q (x, y-5) (x+5.5, y+2.4) |
| `cup` | stroke(3.8): M (x-5.5, y-1.6) Q (x, y+4.6) (x+5.5, y-1.6) |
| `line` | stroke(3.8): M (x-5.5, y+1) L (x+5.5, y+1) |
| `x` | stroke(3.6): M (x-4.5, y-4.5) L (x+4.5, y+4.5) M (x+4.5, y-4.5) L (x-4.5, y+4.5) |
| `none` | nothing |

Blink only changes `oval`, `big` and `small`.

### 4.8 Mouth

Centre `(x, y) = (32 + P.mdx, 38 + P.mdy)`, width `w = P.mw`, `h = w / 2`.

| type | shape |
|---|---|
| `line` | stroke(3.4): M (x-h, y) L (x+h, y) |
| `curve` | stroke(3.4): M (x-h, y-1) Q (x, y+3.2) (x+h, y-1) |
| `big` | stroke(3.4): M (x-h, y-1.6) Q (x, y+4.6) (x+h, y-1.6) |
| `soft` | stroke(3.2): M (x-h, y+1) Q (x, y-1.6) (x+h, y+1) |
| `frown` | stroke(3.4): M (x-h, y+1) Q (x, y-2.6) (x+h, y+1) |
| `o` | circle centre (x, y+0.6), r 2.8, no fill, stroke `ink` width 3 (width ignores `w`) |
| `smirk` | stroke(3.2): M (x-h, y) Q (x+w/4, y+2.4) (x+h, y-2) |
| `D` | filled lower half disc: centre (x, y-2), radius h, angles 0 to 180, closed by the chord. SVG: `M x-h y-2 L x+h y-2 A h h 0 0 1 x-h y-2 Z` |
| `wavy` | stroke(3.0), three quadratics, x0 = x-h: M (x0, y) Q (x0+w/6, y-2.4) (x0+w/3, y) Q (x, y+2.4) (x0+2w/3, y) Q (x+w/3, y-2.4) (x+h, y) |
| `none` | nothing |

### 4.9 Crossfade (eyes and mouth)

For each of eye L, eye R and mouth, with current type `T`, `prev`, `fade`:

```
if prev == null or fade >= 1:  draw(T)
elif fade <= 0:                 draw(prev)
else:
  draw(prev) as a group at opacity (1 - fade)
  draw(T)    as a group at opacity fade
```

Opacity applies to the shape as a whole (SVG `<g opacity>`, Flutter `saveLayer` with an alpha paint),
not per stroke. It only matters for `x` eyes, where two strokes overlap.

### 4.10 Badge

`if P.badge >= 0.5`: rounded rect (25, -3, w 14, h 9, rx 3.5, ry 3.5), fill `C.navy`, drawn last.

## 5. Props

Primitives (all coordinates in scene units; colours are palette tokens):

| type | fields |
|---|---|
| `rect` | `x y w h rx ry`. Radii are already clamped (`rx <= w/2`, `ry <= h/2`); draw an RRect with elliptical corners (rx, ry). |
| `circle` | `cx cy r` |
| `ellipse` | `cx cy rx ry` |
| `path` | `d`: absolute `M`, `L`, `C`, `Z` only, numbers separated by spaces, e.g. `M1 2L3 4C5 6 7 8 9 10Z`. A new `M` starts a new subpath. |
| `group` | `children` (layers), drawn in order inside the group's transform |

Every primitive and group may carry `transform`: a list of ops applied in list order, outermost first
(so the first op is the outermost, as in an SVG `transform` attribute):

```
["translate", tx, ty]     ["scale", sx, sy]     ["rotate", a, px, py]   -- a in degrees about (px, py)
```

Wrap the primitive in save/restore so its transform does not leak. Arcs, quadratics and relative
commands from the generator were converted to cubics at bake time (error far below a pixel).

## 6. Paint rules

- `fill`: token or `null`. `null` means no fill. Fill rule nonzero.
- `stroke` (optional): token; with `strokeWidth`, `cap` (`butt` when absent; `round`), `join`
  (`miter` when absent, miter limit 4; `round`).
- If a token resolves to `null` on the current surface, that paint is skipped; a shape with no
  visible paint is skipped.
- The character's strokes always use round cap and round join; the `o` mouth is a circle stroke.
- Anti-aliasing on. Colours are opaque; only crossfades use opacity.

## 7. Sampling a clip

Clip rows are 30 fps samples of the rig. A row has one number per entry of `fields`; anything listed in
`constants` has that value in every row. Discrete tracks are stored as three fields each:
`eyeL` (index into `eyeTypes`), `eyeLPrev` (index or -1 for none), `eyeLFade` (0..1); the same for
`eyeR` and for `mouth` (indices into `mouthTypes`).

```
locate(clip, t):                       -- t in seconds, t >= 0
  n = clip.frames; fps = clip.fps
  if not clip.loop:
    u = clamp(t * fps, 0, n - 1); i0 = floor(u); return (i0, min(i0 + 1, n - 1), u - i0)
  I = clip.introFrames; L = n - I; u = max(0, t * fps)
  if u < I: i0 = floor(u); return (i0, i0 + 1, u - i0)          -- intro, then into the loop
  v = (u - I) % L; j0 = floor(v); return (I + j0, I + (j0 + 1) % L, v - j0)

mixDiscrete(t0, p0, f0, t1, p1, f1, a):     -- (type, prev, fade) of rows i0 and i1
  if a <= 0:                 return (t0, p0, f0)
  if t0 == t1 and p0 == p1:  return (t0, p0, lerp(f0, f1, a))
  if p1 == t0:               return (t1, p1, f1 * a)               -- switched between the samples
  return a < 0.5 ? (t0, p0, f0) : (t1, p1, f1)

sample(clip, t):
  (i0, i1, a) = locate(clip, t)
  out = copy of clip.constants
  for each numeric field f in clip.fields: out[f] = lerp(row[i0][f], row[i1][f], a)
  for each track in (eyeL, eyeR, mouth) present in fields or constants:
    (ty, pv, fd) = mixDiscrete(values of row i0, values of row i1, a)
    out[track] = table[ty]; out[track + "Prev"] = pv < 0 ? null : table[pv]; out[track + "Fade"] = fd
```

`duration` is `(frames - 1) / fps` for a once clip and the loop period `(frames - introFrames) / fps`
for a loop. Tilt in a clip is unwrapped (a spin goes 0, 90, ... 360), so plain linear interpolation
is correct; never wrap it.

## 8. Combining a clip with the rest pose

Start from the actor's rest pose with `Prev = null`, `Fade = 1`. Then:

- `kind: "absolute"` (bespoke clips): every field in the sample replaces the rest value. Fields the
  clip does not carry (`fold`, `badge`) stay as at rest.
- `kind: "additive"` (pop, idle, blink): for each field in the sample,
  - add: `x y tilt edx edy mdx mdy footL footR footLRot footRRot aLang aRang` -> `pose[f] += v`
  - multiply: `sx sy blink` -> `pose[f] *= v`

Finally multiply `pose.blink` by the actor's blink factor (section 9; 1 when not blinking).

## 9. Player

### 9.1 Phases

```
phase in { rest, motion, idle };  t = seconds into the phase
poses(phase, t):
  rest:   every actor at rest
  motion: clip = motion[state.motion.id]
          for actor i: ref = state.motion.actors entry with actor == i
                       if no ref or t - ref.offset < 0: rest pose
                       else combine(rest_i, sample(clip, t - ref.offset))
  idle:   clip = motion[states.idle.motion]
          actor i: combine(rest_i, sample(clip, t + i * states.idle.actorOffset))
```

### 9.2 Start, tick, end

```
start(play):
  t = 0
  if reducedMotion: phase = rest; render once; stop the frame loop;
                    if play and state.motion.plays == "once": call onDone asynchronously; return
  if play: phase = motion
           end = clip.duration + max(0, offsets of state.motion.actors)
           if state.motion.plays == "loop": initBlinks()
  else:    enterIdle()
  render; start the frame loop

enterIdle(): phase = idle; t = 0; initBlinks()

tick(dt):                                   -- called once per display frame
  t += clamp(dt, 0, 0.1)                    -- a long gap (tab switch, debugger) never jumps far
  if phase == motion and state.motion.plays == "once" and t >= end:
    if state.motion.then == "idle": enterIdle() else: phase = rest; t = 0
    call onDone
  render
```

A loop state (`plays: "loop"`) stays in `motion` for good. The frame loop stops in `rest`.
The first frame of every motion is the rest pose, so a server-rendered rest frame hands over with
no jump.

### 9.3 Blinks (idle phase, and the motion phase of loop states)

Parameters from `states.blink`: `gapMin` 2, `gapMax` 6, `doubleChance` 0.2, `doubleGap` 0.3, `motion`
"blink" (an additive clip with one field, `blink`).

```
gap() = gapMin + (gapMax - gapMin) * random()

initBlinks():                               -- actors in index order
  for i: blinkStart[i] = -infinity; blinkNext[i] = t + gap()

blinkFactor(i):                             -- evaluated every render, after t advanced, actors in index order
  while t >= blinkNext[i]:
    blinkStart[i] = blinkNext[i]
    blinkNext[i] = blinkStart[i] + (random() < doubleChance ? doubleGap : gap())
  d = t - blinkStart[i]
  return 0 <= d <= blinkClip.duration ? sample(blinkClip, d).blink : 1
```

The order of `random()` calls is part of the contract: with the same seed (section 10) and the same
dt sequence, web and Flutter blink on the same frames. No blinks in the rest phase or during a
once motion (the clip carries its own eye animation).

### 9.4 Reduced motion

When the platform asks for reduced motion (web: `prefers-reduced-motion: reduce`, unless the
`reducedMotion` prop overrides it; Flutter: `MediaQuery.disableAnimations`), draw the rest pose only:
no motion, no idle, no blinks. Switching it on mid-play jumps to rest; switching it off starts idle.

### 9.5 Pausing

Stop ticking while the page or app is hidden (web: `visibilitychange`; Flutter: app lifecycle not
`resumed`, or `TickerMode` off). On resume, the next dt is 0 (no catch-up).

## 10. Random source

Players take an injectable `random(): double in [0, 1)`; production may use the platform default.
For tests and parity use mulberry32, all arithmetic unsigned 32-bit:

```
a = seed (uint32)
next():
  a = (a + 0x6D2B79F5) mod 2^32
  t = a
  t = imul(t xor (t >>> 15), t or 1)
  t = t xor (t + imul(t xor (t >>> 7), t or 61))
  return (t xor (t >>> 14)) / 2^32          -- as unsigned
```

`imul` is 32-bit multiplication keeping the low 32 bits. In Dart, mask every intermediate with
`& 0xFFFFFFFF`, and do not rely on 64-bit int overflow (Flutter web compiles ints to JS doubles).
Check values: seed 7 gives 0.011704753153026104, 0.06195825757458806, 0.97690763277933 (tested in `tests/package.test.mjs`).

## 11. Parity

`npm run parity:web` writes `tests/parity/web/*.png` and `tests/parity/manifest.json`: 45 motion
frames (each key state at frames 0, mid and end) and the 85 rest frames, at 480 px, light surface,
canvas filled with the `card` token. A port renders the same manifest to its own folder and runs
`python3 tests/parity/compare.py --a tests/parity/web --b <folder> --manifest tests/parity/manifest.json`.
Expect small anti-aliasing differences between rasterisers; the default tolerances (max 48, mean 0.5,
at most 1% of pixels off by more than 32) allow for them and nothing else. A rasteriser can
anti-alias more coarsely than `rsvg-convert` (Flutter's test rasteriser differs from it by up to 105
on single edge pixels even for identical plain circles and rounded rects), so a port compares twice:
painted at 4x and box-filtered to 480 px at the default tolerances (this checks geometry), and
painted straight at 480 px with only `--tol-max` raised (Flutter: 112; mean and pixel share stay
at their defaults). Evidence and numbers: `docs/flutter.md`.

Static mode: `npm run parity:web:static` writes `tests/parity/web-static/*.png` and
`tests/parity/manifest-static.json`, the resting pose of all 85 states on both surfaces (170 cases) from the web
static entry (`renderRestSvg`), on the `card` colour of the case's surface. A port renders the same manifest with
its static widget and compares under the same rules. The static output must equal the resting frame of the
animated player (section 9.1, `rest` phase), which `tests/static.test.mjs` asserts string for string.

## 12. Reserved for later (format 1 players ignore these)

- A prop primitive may carry `"track": "<name>"`, and a clip may carry `props: { "<name>": { fields,
  constants, rows } }` with fields from `tx ty rot sx sy opacity` and an optional `pivot: [x, y]`.
  When implemented, the prop is drawn inside `translate(tx, ty) rotate(rot) about pivot,
  scale(sx, sy) about pivot`, at `opacity`, before its own `transform`. Format 1 players draw the prop
  at rest.
- Unknown top-level keys in any spec file must be ignored, not rejected.

## Changes

- 2026-10-08, section 11: added the static mode of the parity harness (resting pose only, both surfaces).
  No change to the algorithm, the web player or `spec/`.
- 2026-10-08, section 11: added how a port whose rasteriser anti-aliases more coarsely than
  `rsvg-convert` is compared (4x box-filtered at the default tolerances, plus straight 480 px with
  only `--tol-max` raised). No change to the algorithm, the web player or `spec/`.
