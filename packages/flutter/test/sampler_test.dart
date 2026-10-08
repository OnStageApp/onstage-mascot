import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:onstage_mascot/mascot.dart';
import 'package:onstage_mascot/src/pose.dart';
import 'package:onstage_mascot/src/spec_data.g.dart' as data;

/// The bundled spec plus synthetic clips, so edge cases do not depend on baked data.
MascotSpec _specWith(Map<String, Map<String, Object?>> clips) =>
    MascotSpec.fromJson(
      palette: data.paletteJson,
      states: data.statesJson,
      motion: {
        ...data.motionJson,
        for (final e in clips.entries) e.key: jsonEncode(e.value),
      },
    );

Map<String, Object?> _clip(
  String id,
  List<String> fields,
  List<List<num>> rows, {
  bool loop = false,
  int intro = 0,
  String kind = 'absolute',
  Map<String, num> constants = const {},
  List<String>? eyeTypes,
  List<String>? mouthTypes,
}) => {
  'format': 1,
  'id': id,
  'kind': kind,
  'fps': 30,
  'frames': rows.length,
  'loop': loop,
  'introFrames': intro,
  'duration': loop ? (rows.length - intro) / 30 : (rows.length - 1) / 30,
  'fields': fields,
  'constants': constants,
  'eyeTypes': ?eyeTypes,
  'mouthTypes': ?mouthTypes,
  'rows': rows,
};

void main() {
  final spec = MascotSpec.instance;

  group('locate', () {
    final once = _specWith({
      'once': _clip(
        'once',
        ['x'],
        [
          [0],
          [1],
          [2],
          [3],
        ],
      ),
    }).clip('once')!;
    final loop = _specWith({
      'lp': _clip(
        'lp',
        ['x'],
        [
          [0],
          [1],
          [2],
          [3],
          [4],
        ],
        loop: true,
        intro: 2,
      ),
    }).clip('lp')!;

    test('once clips clamp to the first and last row', () {
      expect(locate(once, -1), (0, 1, 0.0));
      expect(locate(once, 0), (0, 1, 0.0));
      expect(locate(once, 10), (3, 3, 0.0));
      final (i0, i1, a) = locate(once, 1.5 / 30);
      expect((i0, i1), (1, 2));
      expect(a, closeTo(0.5, 1e-12));
    });

    test('loop clips play the intro once, then wrap the loop rows', () {
      expect(locate(loop, 0), (0, 1, 0.0));
      expect(locate(loop, 1.25 / 30).$1, 1);
      expect(locate(loop, 1.25 / 30).$2, 2);
      // Loop rows are 2, 3, 4; the last loop row interpolates into the first loop row.
      final (i0, i1, a) = locate(loop, 4.5 / 30);
      expect((i0, i1), (4, 2));
      expect(a, closeTo(0.5, 1e-9));
      expect(locate(loop, 5.25 / 30).$1, 2);
      expect(locate(loop, 8.25 / 30).$1, 2);
      expect(locate(loop, 9.25 / 30).$1, 3);
    });
  });

  test('sample interpolates numbers linearly and copies constants', () {
    final sp = _specWith({
      'lin': _clip(
        'lin',
        ['x', 'sx'],
        [
          [0, 1],
          [10, 2],
        ],
        constants: {'y': 4},
      ),
    });
    final s = sampleClip(sp.clip('lin')!, 0.25 / 30);
    expect(s.numbers['x'], closeTo(2.5, 1e-9));
    expect(s.numbers['sx'], closeTo(1.25, 1e-9));
    expect(s.numbers['y'], 4);
  });

  test('tilt is never wrapped: a spin interpolates through 360', () {
    final sp = _specWith({
      'spin': _clip(
        'spin',
        ['tilt'],
        [
          [0],
          [170],
          [350],
          [370],
          [-170],
        ],
      ),
    });
    final c = sp.clip('spin')!;
    expect(sampleClip(c, 2.5 / 30).numbers['tilt'], closeTo(360, 1e-9));
    expect(sampleClip(c, 0.5 / 30).numbers['tilt'], closeTo(85, 1e-9));
    // 370 to -170 goes the long way round, through 100, not through 180.
    expect(sampleClip(c, 3.5 / 30).numbers['tilt'], closeTo(100, 1e-9));
  });

  group('mixDiscrete (contract section 7)', () {
    test('a <= 0 keeps the first row', () {
      expect(mixDiscrete(1, 0, 0.3, 2, 1, 0.9, 0), (1, 0, 0.3));
    });
    test('same type and prev interpolates the fade', () {
      final (t, p, f) = mixDiscrete(1, 0, 0.2, 1, 0, 0.6, 0.5);
      expect((t, p), (1, 0));
      expect(f, closeTo(0.4, 1e-12));
    });
    test('a switch between the samples fades from 0', () {
      expect(mixDiscrete(0, -1, 1, 1, 0, 0.5, 0.5), (1, 0, 0.25));
    });
    test('otherwise the nearer row wins', () {
      expect(mixDiscrete(0, -1, 1, 2, 1, 0.5, 0.4), (0, -1, 1.0));
      expect(mixDiscrete(0, -1, 1, 2, 1, 0.5, 0.6), (2, 1, 0.5));
    });
  });

  test('discrete tracks come back as type names with prev and fade', () {
    final hello = spec.clip('hello')!;
    final s = sampleClip(hello, 1.5 / 30);
    final (type, prev, fade) = s.tracks['eyeL']!;
    expect(hello.eyeTypes, contains(type));
    expect(prev == null || hello.eyeTypes!.contains(prev), isTrue);
    expect(fade, inInclusiveRange(0, 1));
  });

  test('additive clips add and multiply on the rest pose', () {
    final st = spec.state('saved');
    final pop = spec.clip('pop')!;
    final rest = MascotPose.rest(st.actors[0]);
    final s = sampleClip(pop, 0.3);
    final p = applySample(st.actors[0], pop, s);
    for (final f in s.numbers.keys) {
      if (['sx', 'sy', 'blink'].contains(f)) {
        expect(p[f], closeTo(rest[f] * s.numbers[f]!, 1e-12), reason: f);
      } else {
        expect(p[f], closeTo(rest[f] + s.numbers[f]!, 1e-12), reason: f);
      }
    }
  });

  test('absolute clips start and end on the rest pose', () {
    for (final st in spec.states) {
      final clip = spec.clip(st.motion.id)!;
      if (!clip.isAbsolute || clip.loop) continue;
      for (final t in [0.0, clip.duration + 1]) {
        final f = computeFrame(st.key, phase: MascotPhase.motion, t: t);
        final rest = computeFrame(st.key);
        for (var i = 0; i < st.actors.length; i++) {
          for (final k in rest.poses[i].values.keys) {
            // An arm with no presence is not drawn, so its other numbers do not matter.
            final side = k.startsWith('aL')
                ? 'aL'
                : (k.startsWith('aR') ? 'aR' : null);
            if (side != null && k != side && rest.poses[i][side] <= 0.02)
              continue;
            var d = f.poses[i][k] - rest.poses[i][k];
            // Tilt is unwrapped: a spin may start or end a whole turn away (all-set starts at -360).
            if (k == 'tilt') d = (d + 180) % 360 - 180;
            expect(d.abs(), lessThan(0.01), reason: '${st.key} t=$t $k');
          }
          expect(f.poses[i].eyeL, rest.poses[i].eyeL, reason: st.key);
          expect(f.poses[i].mouth, rest.poses[i].mouth, reason: st.key);
        }
      }
    }
  });

  test('motion offsets keep later actors at rest until their start', () {
    final st = spec.states.firstWhere(
      (s) => s.motion.actors.values.any((o) => o > 0),
    );
    final late = st.motion.actors.entries.firstWhere((e) => e.value > 0);
    final f = computeFrame(
      st.key,
      phase: MascotPhase.motion,
      t: late.value / 2,
    );
    final rest = MascotPose.rest(st.actors[late.key]);
    expect(f.poses[late.key].values, rest.values);
  });

  test('blink factor multiplies eye height', () {
    final a = computeFrame('idle');
    final b = computeFrame('idle', blink: [0.5]);
    expect(b.poses[0]['blink'], closeTo(a.poses[0]['blink'] * 0.5, 1e-12));
  });

  test('computeFrame frame index uses the clip fps', () {
    final a = computeFrame('hello', phase: MascotPhase.motion, frame: 36);
    final b = computeFrame('hello', phase: MascotPhase.motion, t: 36 / 30);
    expect(a.poses[0].values, b.poses[0].values);
  });
}
