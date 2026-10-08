// Renders every case of tests/parity/manifest-static.json with the BuddyStatic widget, on the card
// colour (a ColoredBox behind the transparent widget), and writes PNGs with the web harness's file
// names to:
//   tests/parity/out/flutter-static/      painted straight at 480 px
//   tests/parity/out/flutter-static/ss4/  painted at 1920 px and box-filtered down to 480 px
// (the same two runs as the animated parity; docs/flutter.md, "Parity"). The web side is
// `npm run parity:web:static`; compare with packages/flutter/tool/parity.sh.
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/rendering.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:onstage_mascot/mascot.dart';
import 'package:onstage_mascot/static.dart';

const String _root = '../..';

void main() {
  final manifestFile = File('$_root/tests/parity/manifest-static.json');

  testWidgets('renders the static parity manifest with BuddyStatic', (
    tester,
  ) async {
    expect(
      manifestFile.existsSync(),
      isTrue,
      reason: 'run `npm run parity:web:static` in the repo root first',
    );
    final manifest =
        jsonDecode(manifestFile.readAsStringSync()) as Map<String, Object?>;
    final size = (manifest['size']! as num).toInt();
    final background = manifest['background']! as String;
    final cases = (manifest['cases']! as List<Object?>)
        .cast<Map<String, Object?>>();
    expect(cases, hasLength(170));

    for (final (folder, ss) in [
      ('flutter-static', 1),
      ('flutter-static/ss4', 4),
    ]) {
      final out = Directory('$_root/tests/parity/out/$folder')
        ..createSync(recursive: true);
      for (final c in cases) {
        final surface = MascotSurface.values.byName(c['surface']! as String);
        final card = MascotSpec.instance.surfaces[surface]![background]!;
        final key = GlobalKey();
        // The widget at its logical size; the test view is large enough, and the capture's pixel
        // ratio is what supersamples, so the widget itself is the same at 1x and 4x.
        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: Align(
              alignment: Alignment.topLeft,
              child: RepaintBoundary(
                key: key,
                child: ColoredBox(
                  color: card,
                  child: BuddyStatic(
                    state: c['state']! as String,
                    surface: surface,
                    size: size.toDouble(),
                    excludeFromSemantics: true,
                  ),
                ),
              ),
            ),
          ),
        );
        final boundary =
            key.currentContext!.findRenderObject()! as RenderRepaintBoundary;
        await tester.runAsync(() async {
          final image = await boundary.toImage(pixelRatio: ss.toDouble());
          expect(image.width, size * ss);
          final png = await _png(image, size, ss);
          File('${out.path}/${c['file']}').writeAsBytesSync(png);
        });
      }
      expect(
        cases.every((c) => File('${out.path}/${c['file']}').existsSync()),
        isTrue,
      );
    }
  });
}

/// [image] as PNG bytes, box-filtered down by [ss] (1 = as is).
Future<Uint8List> _png(ui.Image image, int size, int ss) async {
  if (ss == 1) {
    final png = await image.toByteData(format: ui.ImageByteFormat.png);
    image.dispose();
    return png!.buffer.asUint8List();
  }
  final raw = (await image.toByteData())!.buffer.asUint8List();
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
