#!/bin/sh
# Flutter parity check, from anywhere: renders the web reference frames, the Flutter frames, and
# compares them (docs/flutter.md, "Parity"). Exit code 1 when any comparison fails.
#   packages/flutter/tool/parity.sh            the 130 manifest cases
#   EXTRA=1 packages/flutter/tool/parity.sh    plus the extra cases (crossfades, idle, blink, dark)
#   STATIC=1 packages/flutter/tool/parity.sh   static mode only: BuddyStatic against the web static
#                                              rendering, 85 states on both surfaces (170 cases)
# With STATIC=1 the animated cases are skipped; otherwise the static mode runs after them too.
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
animated=1
if [ "${STATIC:-0}" = 1 ]; then animated=0; fi
if [ "$animated" = 1 ]; then
  npm run --silent parity:web
  if [ "${EXTRA:-0}" = 1 ]; then node packages/flutter/tool/extra-parity-web.mjs; fi
  (cd "$here" && flutter test test/parity_render_test.dart)
fi
npm run --silent parity:web:static
(cd "$here" && flutter test test/parity_static_test.dart)

status=0
cmp() { # a b manifest report [extra compare.py flags]
  a=$1 b=$2 m=$3 r=$4; shift 4
  printf '%s: ' "${b#$root/}"
  python3 tests/parity/compare.py --a "$a" --b "$b" --manifest "$m" --report "$r" "$@" || status=1
}
if [ "$animated" = 1 ]; then
  cmp tests/parity/web "$out" tests/parity/manifest.json "$out/report" --tol-max $TOL_MAX_STRAIGHT --diffs all
  cmp tests/parity/web "$out/ss4" tests/parity/manifest.json "$out/ss4-report"
fi
# Static mode: BuddyStatic against renderRestSvg, same two runs and the same rules.
sout="$root/tests/parity/out/flutter-static"
cmp tests/parity/web-static "$sout" tests/parity/manifest-static.json "$sout/report" --tol-max $TOL_MAX_STRAIGHT --diffs all
cmp tests/parity/web-static "$sout/ss4" tests/parity/manifest-static.json "$sout/ss4-report"
if [ "$animated" = 1 ] && [ -f "$out/extra/manifest.json" ]; then
  cmp "$out/extra/web" "$out/extra/flutter" "$out/extra/manifest.json" "$out/extra/report" --tol-max $TOL_MAX_STRAIGHT --diffs all
  cmp "$out/extra/web" "$out/extra/ss4" "$out/extra/manifest.json" "$out/extra/ss4-report"
fi
exit $status
