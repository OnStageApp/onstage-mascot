// The Flutter player against a trace recorded from the web player (tool/web-trace.mjs): same seed
// and dt sequence must give the same random() calls on the same frames, the same phases and clock,
// and the same eye heights (which carry the blink factor).
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:onstage_mascot/mascot.dart';
import 'package:onstage_mascot/src/spec.dart';

/// Oval eye heights in draw order (layer order, then eye L, eye R), rounded like the web's SVG.
List<double> _ovalRy(MascotFrame f) {
  final out = <double>[];
  void walk(MascotLayer l) {
    switch (l) {
      case ActorLayer(:final actor):
        final p = f.poses[actor];
        for (final (type, prev, fade) in [p.track('eyeL'), p.track('eyeR')]) {
          final shown = [
            if (prev != null && fade < 1) prev,
            if (prev == null || fade > 0) type,
          ];
          for (final t in shown) {
            if (t == 'oval') {
              final ry = math.max(1.9, 7 * p['blink']);
              out.add((ry * 1000).round() / 1000);
            }
          }
        }
      case GroupPrim(:final children):
        children.forEach(walk);
      default:
    }
  }

  f.state.layers.forEach(walk);
  return out;
}

void main() {
  final trace =
      jsonDecode(File('test/fixtures/web_player_trace.json').readAsStringSync())
          as Map<String, Object?>;

  for (final s
      in (trace['scenarios']! as List<Object?>).cast<Map<String, Object?>>()) {
    test('${s['name']}: same random calls, phases, clock and blinks', () {
      final rng = mulberry32((s['seed']! as num).toInt());
      var frame = 0;
      final calls = <List<num>>[];
      var done = 0;
      final p = MascotPlayer(
        state: s['state']! as String,
        playOnMount: s['play']! as bool,
        random: () {
          final v = rng();
          calls.add([frame, v]);
          return v;
        },
        onDone: () => done++,
      );
      final frames = (s['frames']! as List<Object?>)
          .cast<Map<String, Object?>>();
      void check(int i) {
        final w = frames[i];
        expect(p.phase.name, w['phase'], reason: 'frame $i phase');
        expect(
          p.time,
          closeTo((w['t']! as num).toDouble(), 1e-9),
          reason: 'frame $i t',
        );
        expect(
          _ovalRy(p.frame),
          (w['ry']! as List<Object?>).map((v) => (v! as num).toDouble()),
          reason: 'frame $i eyes',
        );
        if (w['done'] != null) expect(done, w['done'], reason: 'frame $i');
      }

      check(0);
      for (final dt in (s['dts']! as List<Object?>).cast<num>()) {
        frame++;
        p.advance(dt.toDouble());
        check(frame);
      }
      expect(calls, s['calls']);
      p.dispose();
    });
  }
}
