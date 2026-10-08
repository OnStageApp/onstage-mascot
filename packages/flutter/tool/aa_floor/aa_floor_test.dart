// Paints tests/parity/out/flutter/aa-floor/scenes.json (from make_scenes.py) with plain Canvas calls.
// Run via tool/aa_floor/run.sh.
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/painting.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final dir = Directory('../../tests/parity/out/flutter/aa-floor');
  testWidgets('paints the anti-aliasing floor scenes', (tester) async {
    await tester.runAsync(() async {
      final scenes =
          jsonDecode(File('${dir.path}/scenes.json').readAsStringSync())
              as List<Object?>;
      Directory('${dir.path}/flutter').createSync(recursive: true);
      const ink = Color(0xFF00275C);
      for (var i = 0; i < scenes.length; i++) {
        final r = ui.PictureRecorder();
        final c = Canvas(r)..scale(2);
        c.drawRect(
          const Rect.fromLTWH(0, 0, 240, 240),
          Paint()..color = const Color(0xFFF4F4F2),
        );
        final fill = Paint()..color = ink;
        for (final o
            in (scenes[i]! as List<Object?>).cast<Map<String, Object?>>()) {
          double d(String k) => (o[k]! as num).toDouble();
          final stroke = Paint()
            ..color = ink
            ..style = PaintingStyle.stroke;
          final at = Offset(d('x'), d('y'));
          switch (o['k']) {
            case 'circle':
              c.drawCircle(at, d('r'), fill);
            case 'ring':
              c.drawCircle(at, d('r'), stroke..strokeWidth = d('w'));
            case 'ellipse':
              c.drawOval(
                Rect.fromCenter(
                  center: at,
                  width: 2 * d('rx'),
                  height: 2 * d('ry'),
                ),
                fill,
              );
            case 'rrect':
              c
                ..save()
                ..translate(at.dx, at.dy)
                ..rotate(d('a') * math.pi / 180)
                ..translate(-at.dx, -at.dy)
                ..drawRRect(
                  RRect.fromRectXY(
                    Rect.fromLTWH(at.dx, at.dy, d('w'), d('h')),
                    d('r'),
                    d('r'),
                  ),
                  fill,
                )
                ..restore();
            default:
              c.drawPath(
                Path()
                  ..moveTo(at.dx, at.dy)
                  ..quadraticBezierTo(
                    at.dx + d('dx') / 2,
                    at.dy + d('dy'),
                    at.dx + d('dx'),
                    at.dy,
                  ),
                stroke
                  ..strokeWidth = d('w')
                  ..strokeCap = StrokeCap.round
                  ..strokeJoin = StrokeJoin.round,
              );
          }
        }
        final img = await r.endRecording().toImage(480, 480);
        final png = await img.toByteData(format: ui.ImageByteFormat.png);
        File(
          '${dir.path}/flutter/${i.toString().padLeft(2, '0')}.png',
        ).writeAsBytesSync(png!.buffer.asUint8List());
      }
    });
  }, skip: !File('${dir.path}/scenes.json').existsSync());
}
