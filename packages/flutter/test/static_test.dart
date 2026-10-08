// The static library: BuddyStatic draws the resting frame of a state, with no Ticker, no timers and
// no motion data. These tests pin that down: the import graph of lib/static.dart, the widget itself,
// and that it paints exactly what the animated Buddy and the frame painter draw at rest.
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/rendering.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:onstage_mascot/mascot.dart';
import 'package:onstage_mascot/static.dart' as static_lib;
import 'package:onstage_mascot/src/static_buddy.dart' show restFrame;

/// The files lib/static.dart loads: itself plus every import and export, followed transitively.
/// Only `package:onstage_mascot/` and relative paths are followed; the Flutter SDK is not.
Set<String> _closure(String entry) {
  final seen = <String>{};
  void visit(String path) {
    if (!seen.add(path)) return;
    final text = File(path).readAsStringSync();
    final re = RegExp(
      r'''^\s*(?:import|export)\s+['"]([^'"]+)['"]''',
      multiLine: true,
    );
    for (final m in re.allMatches(text)) {
      final target = m.group(1)!;
      final dir = File(path).parent.path;
      if (target.startsWith('package:onstage_mascot/')) {
        visit('lib/${target.substring('package:onstage_mascot/'.length)}');
      } else if (!target.contains(':')) {
        visit(File('$dir/$target').absolute.uri.normalizePath().toFilePath());
      }
    }
  }

  visit(File(entry).absolute.path);
  return seen.map((p) {
    final root = Directory.current.absolute.path;
    return p.startsWith(root) ? p.substring(root.length + 1) : p;
  }).toSet();
}

Widget _wrap(Widget child) => Directionality(
  textDirection: TextDirection.ltr,
  child: MediaQuery(
    data: const MediaQueryData(),
    child: Center(child: child),
  ),
);

/// Pumps [child] inside a RepaintBoundary and returns its pixels at [px] by [px].
Future<Uint8List> _pixels(WidgetTester tester, Widget child, int px) async {
  final key = GlobalKey();
  await tester.pumpWidget(_wrap(RepaintBoundary(key: key, child: child)));
  final boundary =
      key.currentContext!.findRenderObject()! as RenderRepaintBoundary;
  late Uint8List bytes;
  await tester.runAsync(() async {
    final image = await boundary.toImage();
    expect(image.width, px);
    bytes = (await image.toByteData())!.buffer.asUint8List();
    image.dispose();
  });
  return bytes;
}

Future<Uint8List> _frameImage(
  MascotFrame frame,
  int px,
  MascotSurface surface,
) async {
  final image = await renderMascotImage(frame, px, surface: surface);
  final bytes = (await image.toByteData())!.buffer.asUint8List();
  image.dispose();
  return bytes;
}

void main() {
  group('import graph', () {
    test(
      'lib/static.dart does not reach the player, sampler, rng or motion data',
      () {
        final files = _closure('lib/static.dart');
        const forbidden = [
          'lib/src/player.dart',
          'lib/src/pose.dart',
          'lib/src/spec.dart',
          'lib/src/motion_data.g.dart',
          'lib/src/rng.dart',
          'lib/src/buddy.dart',
          'lib/mascot.dart',
        ];
        for (final f in forbidden) {
          expect(
            files,
            isNot(contains(f)),
            reason: 'static.dart must not load $f ($files)',
          );
        }
        expect(files, contains('lib/src/states_data.g.dart'));
        expect(files, contains('lib/src/painter.dart'));
        expect(files, contains('lib/src/static_buddy.dart'));
      },
    );

    test(
      'nothing it loads uses a Ticker, AnimationController, Timer or the player',
      () {
        final text = _closure(
          'lib/static.dart',
        ).map((f) => File(f).readAsStringSync()).join('\n');
        final code = text
            .split('\n')
            .where((l) => !l.trimLeft().startsWith('//'))
            .join('\n');
        for (final word in [
          'Ticker',
          'AnimationController',
          'Timer',
          'MascotPlayer',
          'SchedulerBinding',
          'WidgetsBindingObserver',
          'StatefulWidget',
          'motionJson',
          'MascotClip',
        ]) {
          expect(code, isNot(contains(word)), reason: word);
        }
      },
    );

    test('control: the animated library does reach them', () {
      final files = _closure('lib/mascot.dart');
      expect(files, contains('lib/src/motion_data.g.dart'));
      expect(files, contains('lib/src/player.dart'));
    });
  });

  group('BuddyStatic', () {
    testWidgets(
      'is a StatelessWidget, 160 px by default, and schedules no frames',
      (tester) async {
        const w = static_lib.BuddyStatic(state: 'hello');
        expect(w, isA<StatelessWidget>());
        await tester.pumpWidget(_wrap(w));
        expect(
          tester.getSize(find.byType(static_lib.BuddyStatic)),
          const Size(160, 160),
        );
        expect(tester.binding.hasScheduledFrame, isFalse);
        await tester.pump(const Duration(seconds: 5));
        expect(tester.binding.hasScheduledFrame, isFalse);
        expect(
          tester.binding.transientCallbackCount,
          0,
          reason: 'no Ticker is running',
        );
      },
    );

    testWidgets('builds every state on both surfaces', (tester) async {
      for (final key in static_lib.mascotStateKeys) {
        for (final surface in MascotSurface.values) {
          await tester.pumpWidget(
            _wrap(
              static_lib.BuddyStatic(state: key, surface: surface, size: 64),
            ),
          );
          expect(
            tester.takeException(),
            isNull,
            reason: '$key ${surface.name}',
          );
        }
      }
      expect(static_lib.mascotStateKeys, hasLength(85));
    });

    testWidgets('an unknown state throws like Buddy', (tester) async {
      await tester.pumpWidget(
        _wrap(const static_lib.BuddyStatic(state: 'nope')),
      );
      expect(tester.takeException(), isA<ArgumentError>());
    });

    testWidgets('semantics: state name by default, custom label, hidden', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(const static_lib.BuddyStatic(state: 'no-events')),
      );
      expect(find.bySemanticsLabel('No events yet'), findsOneWidget);

      await tester.pumpWidget(
        _wrap(
          const static_lib.BuddyStatic(
            state: 'no-events',
            semanticLabel: 'Nothing planned',
          ),
        ),
      );
      expect(find.bySemanticsLabel('Nothing planned'), findsOneWidget);
      expect(find.bySemanticsLabel('No events yet'), findsNothing);

      await tester.pumpWidget(
        _wrap(
          const static_lib.BuddyStatic(state: 'no-events', semanticLabel: ''),
        ),
      );
      expect(find.bySemanticsLabel('No events yet'), findsNothing);

      await tester.pumpWidget(
        _wrap(
          const static_lib.BuddyStatic(
            state: 'no-events',
            excludeFromSemantics: true,
          ),
        ),
      );
      expect(find.bySemanticsLabel('No events yet'), findsNothing);
      expect(find.byType(ExcludeSemantics), findsWidgets);
      handle.dispose();
    });

    testWidgets(
      'paints exactly the frame painter\'s rest frame, 85 states x 2 surfaces',
      (tester) async {
        const px = 96;
        for (final key in static_lib.mascotStateKeys) {
          for (final surface in MascotSurface.values) {
            final widget = await _pixels(
              tester,
              static_lib.BuddyStatic(
                state: key,
                surface: surface,
                size: px.toDouble(),
              ),
              px,
            );
            late Uint8List expected;
            await tester.runAsync(() async {
              expected = await _frameImage(computeFrame(key), px, surface);
            });
            expect(
              widget,
              orderedEquals(expected),
              reason: '$key ${surface.name}',
            );
          }
        }
      },
    );

    testWidgets('paints exactly the resting frame of the animated Buddy', (
      tester,
    ) async {
      const px = 120;
      for (final key in [
        'hello',
        'no-events',
        'loading',
        'all-set',
        'oops',
        'sleepy',
      ]) {
        for (final surface in MascotSurface.values) {
          final animated = await _pixels(
            tester,
            Buddy(
              state: key,
              surface: surface,
              size: px.toDouble(),
              reducedMotion: true,
            ),
            px,
          );
          final stat = await _pixels(
            tester,
            static_lib.BuddyStatic(
              state: key,
              surface: surface,
              size: px.toDouble(),
            ),
            px,
          );
          expect(stat, orderedEquals(animated), reason: '$key ${surface.name}');
        }
      }
    });
  });

  group('rest frame and state info', () {
    test('restFrame has the same poses as computeFrame at rest', () {
      for (final key in MascotSpec.instance.stateKeys) {
        final a = restFrame(MascotSpec.instance.state(key));
        final b = computeFrame(key);
        expect(a.poses.length, b.poses.length, reason: key);
        for (var i = 0; i < a.poses.length; i++) {
          expect(a.poses[i].values, b.poses[i].values, reason: key);
          expect(
            a.poses[i].track('eyeL'),
            b.poses[i].track('eyeL'),
            reason: key,
          );
          expect(
            a.poses[i].track('eyeR'),
            b.poses[i].track('eyeR'),
            reason: key,
          );
          expect(
            a.poses[i].track('mouth'),
            b.poses[i].track('mouth'),
            reason: key,
          );
        }
      }
    });

    test('mascotStateInfo lists the 85 states with group, name and use', () {
      final info = static_lib.mascotStateInfo;
      expect(info, hasLength(85));
      for (final (i, s) in MascotSpec.instance.states.indexed) {
        expect(info[i].key, s.key);
        expect(info[i].group, s.group);
        expect(info[i].name, s.name);
        expect(info[i].use, s.use);
      }
      expect(static_lib.mascotStateKeys, MascotSpec.instance.stateKeys);
    });
  });
}
