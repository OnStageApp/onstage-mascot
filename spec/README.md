# spec/ format 1

The mascot as data. Every player (web, Flutter) reads these files and nothing else; the exact drawing
and playback algorithm is in [`docs/renderer-contract.md`](../docs/renderer-contract.md).

| File | Edited by | What |
|---|---|---|
| `palette.json` | hand | Colour tokens per surface (`light`, `dark`). |
| `states.json` | hand | All 85 states: scene (actors and props), rest poses, which motion plays. |
| `motion/<id>.json` | `npm run bake` only | Baked frames. Never edit by hand; change `tools/motion/definitions.mjs` and re-bake. |

`palette.json` and `states.json` were imported once from the state generator (the drawing the Figma
component set `Mascot/Buddy App` was made from) by `npm run bake -- --import`. From now on they are
the source of truth: edit them, then `npm run bake && npm run build && npm test`. A re-import would
overwrite hand edits.

## palette.json

```json
{ "format": 1, "tokens": ["body", "feet", "arm", "shadow", "navy", ...],
  "surfaces": { "light": { "body": "#A4D4E3", ... }, "dark": { ..., "shadow": null } } }
```

Scenes and players only ever name tokens. `null` means "do not draw" (the ground shadow is hidden on
dark). `feet` and `arm` are separate tokens so a navy-feet variant is a palette change; today they
equal `body`. `card` is the reference background (#F4F4F2), not part of any scene. `mapLine` is the
one-off fold line on the map prop.

Tokens: body #A4D4E3 (brand blue), feet, arm, shadow #7FBFD3, navy #00275C, ghost #CBE6EE (empty or
missing things), deep #00588C, mapLine #B5D9E4, coral #F28B7D, coralLight #F8BFB8, coralDark #AE6F74,
onCoral (ink on coral, navy today), mint #8FD6B5, white, card.

## states.json

```json
{ "format": 1, "canvas": { "width": 240, "height": 240 }, "ground": 196, "groups": [...],
  "idle":  { "motion": "idle", "actorOffset": 0.7 },
  "blink": { "motion": "blink", "gapMin": 2, "gapMax": 6, "doubleChance": 0.2, "doubleGap": 0.3 },
  "states": [ {
    "key": "hello", "group": "Welcome", "name": "Hello", "use": "First open, sign-in, greetings",
    "actors": [ { "cx": 120, "by": 196, "s": 2.2, "shadow": true, "rest": { pose } } ],
    "layers": [ { "type": "actor", "actor": 0 }, { "type": "rect", ... } ],
    "motion": { "id": "hello", "plays": "once", "then": "idle", "actors": [ { "actor": 0, "offset": 0 } ] }
  } ] }
```

- `key`: the Figma variant key (`state=<key>`). Never rename one; tests assert the list equals the generator's.
- `actors`: each Buddy in the scene. Placement in scene units (`cx` centre, `by` tile bottom, `s`
  scale); `rest` is the full pose in body units (fields listed in the contract, section 2).
- `layers`: draw order. `actor` layers place a Buddy (with its ground shadow); everything else is a
  prop primitive: `rect` (x y w h rx ry), `circle` (cx cy r), `ellipse` (cx cy rx ry), `path` (d, absolute
  M L C Z only), `group` (children). Any of them may have `transform` (list of `translate`, `scale`,
  `rotate` ops) and paint: `fill` (token or null), optional `stroke`, `strokeWidth`, `cap`, `join`.
  `track` is reserved for animated props.
- `motion`: the clip `id` in `motion/`, `plays` (`once` or `loop`), `then` (`idle`, or null for loops),
  and which actors it drives with a start `offset` in seconds. Actors not listed stay at rest.

## motion/&lt;id&gt;.json

```json
{ "format": 1, "id": "hello", "kind": "absolute", "fps": 30, "frames": 74, "loop": false,
  "introFrames": 0, "duration": 2.433,
  "fields": ["x", "y", "tilt", ...], "constants": { "edx": 0, ... },
  "eyeTypes": ["arc", "oval"], "mouthTypes": ["big", "curve"],
  "props": {},
  "rows": [ [0, 0, -6, ...], ... ] }
```

- Header plus rows: each row is one 30 fps sample, numbers rounded to 3 decimals, one per `fields`
  entry. Columns that never change are in `constants` instead.
- Eye and mouth tracks are three columns each: type index, previous type index (-1 for none) and
  crossfade 0..1, against the clip's `eyeTypes` / `mouthTypes` tables.
- `kind: "absolute"`: a full pose for the actor (bespoke clips; first and last frames equal the rest pose).
  `kind: "additive"`: offsets on top of any rest pose (`pop`, `idle`, `blink`, and the extra clips below).
  Additive clips may carry `shadow`, a factor on the ground shadow's size (1 when absent).
- `loop: true`: rows `[0, introFrames)` play once from rest, then rows `[introFrames, frames)` repeat.
- `source`: how the clip was made, for people.
- `props`: reserved for animated prop tracks (empty in format 1).

The rig runs at 60 fps; the files keep every second frame. `reports/bake-report.json` records how far
linear interpolation of the 30 fps rows strays from the 60 fps rig, per clip.

## Clips

| id | kind | plays | used by |
|---|---|---|---|
| `pop` | additive | once | every state without its own motion (70) |
| `idle` | additive | loop (3 s) | every state after its motion |
| `blink` | additive | once (scheduled by the player) | idle |
| `hello`, `welcome-team`, `all-set`, `no-events`, `no-results`, `event-created`, `invite-sent`, `plan-ready`, `done`, `waiting`, `offline`, `oops`, `session-expired`, `sleepy` | absolute | once | the state with the same key |
| `loading` | absolute | loop (1.6 s, with intro) | loading (all three Buddies, a third of a hop apart) |
| `hop` | additive | once (0.6 s, settled by 0.8 s) | extra clip: about 6 body units up (12 px at a 220 px render), squash and stretch, shadow shrinks on the ground |
| `glance-left`, `glance-right` | additive | once (1.4 s, settled by 1.6 s) | extra clip: eyes 4 body units to the side and a little up, head tilt 1.5, half blink at the turn |
| `look-around` | additive | once (2.4 s, settled by 2.6 s) | extra clip: left, blink at the centre, right, back |

Extra clips belong to no state: a player plays them on demand (`player.playClip(id)`) or now and then
while idling (the `ambient` option); see `docs/renderer-contract.md` section 9.6.

## Versioning

`format` changes only for a breaking change in these files. Adding states, tokens or clips is not
breaking. Players must ignore keys they do not know.
