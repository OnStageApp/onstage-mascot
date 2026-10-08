## Fixes and descriptions

- Redrawn in Figma: none. All 85 variants are within tolerance, so no variant was touched and `before/` is empty.
- Dry run: the redraw pattern (createNodeFromSvg, move children into the variant, remove the temp node) was tested on a
  throwaway component, not on a variant. It rendered with the same numbers as the existing `hello` variant (0.0009 percent
  over delta, max diff 29), which shows the variants were drawn from the same SVG. The throwaway was removed.
- Descriptions written: 85 variant components plus the component set (sync paragraph appended to the existing text).
- Export method: temporary 2x instances (480 px) of each variant were screenshotted with get_screenshot and removed again.
  The set, the board and all other nodes were not modified.
