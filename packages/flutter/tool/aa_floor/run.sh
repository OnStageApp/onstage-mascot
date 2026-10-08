#!/bin/sh
# Measures the anti-aliasing floor between rsvg-convert and Flutter's test rasteriser on plain
# shapes (docs/flutter.md, "Why two comparisons"). Prints compare.py's summary at default tolerances.
set -eu
here=$(cd "$(dirname "$0")/../.." && pwd)
root=$(cd "$here/../.." && pwd)
python3 "$here/tool/aa_floor/make_scenes.py"
(cd "$here" && flutter test tool/aa_floor/aa_floor_test.dart)
out="$root/tests/parity/out/flutter/aa-floor"
python3 "$root/tests/parity/compare.py" --a "$out/web" --b "$out/flutter" --report "$out/report" --diffs all || true
