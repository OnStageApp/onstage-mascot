// Renders every case of tests/parity/manifest.json with the Flutter painter, at the manifest size
// on the manifest background, and writes PNGs with the web harness's file names to:
//   tests/parity/out/flutter/      painted straight at 480 px
//   tests/parity/out/flutter/ss4/  painted at 1920 px and box-filtered down to 480 px, which
//                                  averages out the test rasteriser's coarse anti-aliasing
// When tests/parity/out/flutter/extra/manifest.json exists (tool/extra-parity-web.mjs), its
// cases are rendered the same way into extra/flutter/ and extra/ss4/.
// Then compare with the web frames: packages/flutter/tool/parity.sh (see docs/flutter.md).
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter_test/flutter_test.dart';
import 'package:onstage_mascot/mascot.dart';

const String _root = '../..';

void main() {
  final manifestFile = File('$_root/tests/parity/manifest.json');

  testWidgets('renders the parity manifest to tests/parity/out/flutter', (
    tester,
  ) async {
    expect(
      manifestFile.existsSync(),
      isTrue,
      reason: 'run `npm run parity:web` in the repo root first',
    );
    final manifest =
        jsonDecode(manifestFile.readAsStringSync()) as Map<String, Object?>;
    final size = (manifest['size']! as num).toInt();
    final surface = MascotSurface.values.byName(manifest['surface']! as String);
    final background = manifest['background']! as String;
    final cases = (manifest['cases']! as List<Object?>)
        .cast<Map<String, Object?>>();

    await tester.runAsync(() async {
      for (final (folder, ss) in [('flutter', 1), ('flutter/ss4', 4)]) {
        final out = Directory('$_root/tests/parity/out/$folder')
          ..createSync(recursive: true);
        for (final c in cases) {
          final frame = computeFrame(
            c['state']! as String,
            phase: MascotPhase.values.byName(c['phase']! as String),
            frame: (c['frame']! as num).toDouble(),
          );
          final image = await renderMascotImage(
            frame,
            size * ss,
            surface: surface,
            background: background,
          );
          final png = await _png(image, size, ss);
          File('${out.path}/${c['file']}').writeAsBytesSync(png);
        }
        expect(
          cases.every((c) => File('${out.path}/${c['file']}').existsSync()),
          isTrue,
        );
      }
    });
  });

  final extraFile = File('$_root/tests/parity/out/flutter/extra/manifest.json');
  testWidgets('renders the extra parity cases', (tester) async {
    final manifest =
        jsonDecode(extraFile.readAsStringSync()) as Map<String, Object?>;
    final size = (manifest['size']! as num).toInt();
    final background = manifest['background']! as String;
    final cases = (manifest['cases']! as List<Object?>)
        .cast<Map<String, Object?>>();
    await tester.runAsync(() async {
      for (final (folder, ss) in [('flutter', 1), ('ss4', 4)]) {
        final out = Directory('${extraFile.parent.path}/$folder')
          ..createSync(recursive: true);
        for (final c in cases) {
          final frame = computeFrame(
            c['state']! as String,
            phase: MascotPhase.values.byName(c['phase']! as String),
            t: (c['t']! as num).toDouble(),
            blink: (c['blink'] as List<Object?>?)
                ?.map((b) => (b! as num).toDouble())
                .toList(),
          );
          final image = await renderMascotImage(
            frame,
            size * ss,
            surface: MascotSurface.values.byName(
              c['surface'] as String? ?? 'light',
            ),
            background: background,
          );
          File(
            '${out.path}/${c['file']}',
          ).writeAsBytesSync(await _png(image, size, ss));
        }
      }
    });
  }, skip: !extraFile.existsSync());
}

/// [image] as PNG bytes, box-filtered down by [ss] (1 = as is).
Future<Uint8List> _png(ui.Image image, int size, int ss) async {
  if (ss == 1) {
    final png = await image.toByteData(format: ui.ImageByteFormat.png);
    image.dispose();
    return png!.buffer.asUint8List();
  }
  final raw = (await image.toByteData(
    format: ui.ImageByteFormat.rawRgba,
  ))!.buffer.asUint8List();
  final big = size * ss;
  image.dispose();
  final small = Uint8List(size * size * 4);
  final n = ss * ss;
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      for (var ch = 0; ch < 4; ch++) {
        var sum = 0;
        for (var dy = 0; dy < ss; dy++) {
          final row = (y * ss + dy) * big;
          for (var dx = 0; dx < ss; dx++) {
            sum += raw[(row + x * ss + dx) * 4 + ch];
          }
        }
        small[(y * size + x) * 4 + ch] = (sum + n ~/ 2) ~/ n;
      }
    }
  }
  final done = Completer<ui.Image>();
  ui.decodeImageFromPixels(
    small,
    size,
    size,
    ui.PixelFormat.rgba8888,
    done.complete,
  );
  final down = await done.future;
  final png = await down.toByteData(format: ui.ImageByteFormat.png);
  down.dispose();
  return png!.buffer.asUint8List();
}
