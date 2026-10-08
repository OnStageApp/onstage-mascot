import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:onstage_mascot/mascot.dart';

Widget _wrap(Widget child, {bool disableAnimations = false}) => MediaQuery(
  data: MediaQueryData(disableAnimations: disableAnimations),
  child: Directionality(
    textDirection: TextDirection.ltr,
    child: Center(child: child),
  ),
);

void main() {
  testWidgets('plays the motion once, calls onDone, then idles', (
    tester,
  ) async {
    var done = 0;
    await tester.pumpWidget(
      _wrap(Buddy(state: 'hello', onDone: () => done++, random: mulberry32(7))),
    );
    expect(find.byType(RepaintBoundary), findsWidgets);
    expect(tester.getSize(find.byType(Buddy)), const Size(160, 160));
    final duration = MascotSpec.instance.clip('hello')!.duration;
    for (var t = 0.0; t < duration + 0.1; t += 1 / 60) {
      await tester.pump(const Duration(microseconds: 16667));
    }
    expect(done, 1);
    // Idle keeps ticking; nothing else completes.
    await tester.pump(const Duration(seconds: 1));
    expect(done, 1);
    expect(tester.binding.hasScheduledFrame, isTrue);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('reduced motion: rest pose only, onDone soon, no ticking', (
    tester,
  ) async {
    var done = 0;
    await tester.pumpWidget(
      _wrap(
        Buddy(state: 'all-set', onDone: () => done++),
        disableAnimations: true,
      ),
    );
    await tester.pump();
    expect(done, 1);
    expect(tester.binding.hasScheduledFrame, isFalse);
  });

  testWidgets('the reducedMotion prop overrides MediaQuery', (tester) async {
    var done = 0;
    await tester.pumpWidget(
      _wrap(
        Buddy(state: 'all-set', reducedMotion: false, onDone: () => done++),
        disableAnimations: true,
      ),
    );
    await tester.pump(const Duration(milliseconds: 100));
    expect(done, 0);
    expect(tester.binding.hasScheduledFrame, isTrue);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('pauses while the app is not resumed', (tester) async {
    await tester.pumpWidget(_wrap(const Buddy(state: 'loading', size: 120)));
    await tester.pump(const Duration(milliseconds: 50));
    expect(tester.binding.hasScheduledFrame, isTrue);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.hidden);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.paused);
    await tester.pump();
    expect(tester.binding.hasScheduledFrame, isFalse);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.hidden);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await tester.pump();
    expect(tester.binding.hasScheduledFrame, isTrue);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('semantics label defaults to the state name; empty hides it', (
    tester,
  ) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(
      _wrap(const Buddy(state: 'hello', reducedMotion: true)),
    );
    expect(find.bySemanticsLabel('Hello'), findsOneWidget);
    await tester.pumpWidget(
      _wrap(const Buddy(state: 'hello', reducedMotion: true, label: '')),
    );
    expect(find.bySemanticsLabel('Hello'), findsNothing);
    handle.dispose();
  });

  testWidgets(
    'every state paints on both surfaces at rest, mid motion and idle',
    (tester) async {
      await tester.runAsync(() async {
        for (final st in MascotSpec.instance.states) {
          for (final surface in MascotSurface.values) {
            for (final (phase, t) in [
              (MascotPhase.rest, 0.0),
              (MascotPhase.motion, 0.7),
              (MascotPhase.idle, 1.3),
            ]) {
              final img = await renderMascotImage(
                computeFrame(st.key, phase: phase, t: t),
                48,
                surface: surface,
                background: 'card',
              );
              expect(img.width, 48);
              img.dispose();
            }
          }
        }
      });
    },
  );
}
