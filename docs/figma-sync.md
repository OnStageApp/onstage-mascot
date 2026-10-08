# Keeping Figma in sync with the code

The Figma component set `Mascot/Buddy App` (file `1VPm7pdTmRLUI0KWmF37dR`, BRAND page `63974:99457`, set
`65119:17579`) and the code must show the same resting pose for every state. **Code wins.** If they differ, the
Figma variant is redrawn from the code's SVG; the code is never bent to match a hand edit in Figma. The variant name
`state=<key>` is the state key in `spec/states.json`. Never rename or delete a variant from the sync, only report it.

Figma is reached through the Figma tools (`use_figma`, `get_screenshot`), not from CI, so the sync is run by an agent
in a Claude Code session. The agent must load the `figma-use` skill before every `use_figma` call and pass
`skillNames: "figma-use"`. The page is edited by people in parallel: look nodes up by name or id and re-read right
before each write.

## Re-running the sync

1. **Names.** Run `tools/figma/read-names.js` with `use_figma`. Save the names to
   `reports/figma-parity/figma-names.json`. `compare.py` reports keys missing on either side.
2. **Code frames.** From the repo root:
   `npm run render-png -- --all --size 480 --background card --out reports/figma-parity/code`
   (480 px, background #F4F4F2, resting pose, light surface).
3. **Figma frames.** Run `tools/figma/make-export-instances.js`. It places a temporary frame with one 2x instance
   (480 px) per variant at the right edge of the page. Call `get_screenshot` for each returned instance id with
   `maxDimension: 480` and `contentsOnly: true`, then `curl` each URL into `reports/figma-parity/figma/<key>.png`
   (transparent PNG). Finish with `tools/figma/remove-export-instances.js`. (`export-batch-base64.js` is the
   fallback through `exportAsync`; it costs about 13 KB of base64 per variant, so avoid it.) Variants are 240 px, and
   a screenshot never upscales, which is why the 2x instances are used.
4. **Compare.** `python3 tools/figma/compare.py` writes `reports/figma-parity/report.md`, `report.json` and, for
   flagged states, `diff/<key>.png` (code, Figma, difference side by side). Both sides are composited on #F4F4F2 first.
5. **Fix flagged variants** (code wins). For each key: copy the old export to `reports/figma-parity/before/<key>.png`,
   run `node tools/render-svg.mjs <key> --size 240` (no background, so it stays transparent), paste the SVG into
   `tools/figma/redraw-variant.js`, run it, then re-export and re-compare. The variant node, its name and its position
   stay; only its children are replaced. If the flagged difference looks like a deliberate improvement, still redraw
   (code wins) but call it out so the owner can decide whether to change `spec/` instead.
6. **Descriptions.** `node tools/figma/build-descriptions.mjs` prints the payload built from `spec/`. Paste it into
   `tools/figma/set-descriptions.js` and run it. Each variant description reads
   `Key: <key>. Motion: <clip> (plays once, <seconds>, then idle). Use it for: <use>.` and the component set keeps its
   text plus a "Sync with code" paragraph. Descriptions only exist on COMPONENT and COMPONENT_SET nodes. Avoid `<`, `>`,
   `&` and apostrophes: the tool stores them as HTML entities.

## What the tolerance means

Figma and rsvg antialias differently, and imported strokes can sit a fraction of a pixel apart, so a strict pixel
equality would flag everything. `compare.py` computes, per state, the share of pixels whose largest channel difference
exceeds 24/255, plus the share of pixels where the non-background silhouette differs. A state is flagged when:

- more than **0.3 percent** of pixels differ by more than **24/255**, or
- the silhouette differs by more than **0.1 percent** of pixels (a shape is missing or moved).

The numbers come from the first run (2026-10-08, all 85 states matched): median 0.0017 percent, p90 0.05, worst
0.227 percent (`sleepy`), silhouette XOR at most 0.064 percent. Visual checks of the worst cases showed only thin
1 px rings around strokes. A moved or missing shape of normal size changes well over 1 percent of pixels, so the
0.3 percent line sits between antialiasing noise and real defects. Tune it with `--pct` and `--delta`, and change it
here if the evidence changes.

## Files

| File | What |
|---|---|
| `tools/figma/read-names.js` | variant names, sizes, fills of the set |
| `tools/figma/make-export-instances.js`, `remove-export-instances.js` | temporary 2x instances for exporting |
| `tools/figma/export-batch-base64.js` | fallback export through `exportAsync` |
| `tools/figma/redraw-variant.js` | redraw one variant in place from code SVG |
| `tools/figma/build-descriptions.mjs`, `set-descriptions.js` | variant and set descriptions from `spec/` |
| `tools/figma/compare.py` | name sync and pixel comparison, writes `reports/figma-parity/` |
