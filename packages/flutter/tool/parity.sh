#!/bin/sh
# Flutter parity check, from anywhere: renders the web reference frames, the Flutter frames, and
# compares them (docs/flutter.md, "Parity"). Exit code 1 when any comparison fails.
#   packages/flutter/tool/parity.sh            the 130 manifest cases
#   EXTRA=1 packages/flutter/tool/parity.sh    plus the extra cases (crossfades, idle, blink, dark)
set -eu
here=$(cd "$(dirname "$0")/.." && pwd)
root=$(cd "$here/../.." && pwd)
out="$root/tests/parity/out/flutter"
# The test rasteriser (Skia on the CPU, in flutter_tester) anti-aliases more coarsely than
# rsvg-convert: identical simple shapes differ by up to 105 on an edge pixel. So the straight
# 480 px frames are held to --tol-max 112 (mean and pixel share unchanged); the supersampled
# frames, which average that out, are held to the default tolerances. docs/flutter.md has the evidence.
TOL_MAX_STRAIGHT=112

cd "$root"
npm run --silent parity:web
if [ "${EXTRA:-0}" = 1 ]; then node packages/flutter/tool/extra-parity-web.mjs; fi
(cd "$here" && flutter test test/parity_render_test.dart)

status=0
cmp() { # a b manifest report [extra compare.py flags]
  a=$1 b=$2 m=$3 r=$4; shift 4
  printf '%s: ' "${b#$root/}"
  python3 tests/parity/compare.py --a "$a" --b "$b" --manifest "$m" --report "$r" "$@" || status=1
}
cmp tests/parity/web "$out" tests/parity/manifest.json "$out/report" --tol-max $TOL_MAX_STRAIGHT --diffs all
cmp tests/parity/web "$out/ss4" tests/parity/manifest.json "$out/ss4-report"
if [ -f "$out/extra/manifest.json" ]; then
  cmp "$out/extra/web" "$out/extra/flutter" "$out/extra/manifest.json" "$out/extra/report" --tol-max $TOL_MAX_STRAIGHT --diffs all
  cmp "$out/extra/web" "$out/extra/ss4" "$out/extra/manifest.json" "$out/extra/ss4-report"
fi
exit $status
