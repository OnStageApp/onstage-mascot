// The static widget: the resting pose of a state, drawn once. Stateless, no Ticker, no
// AnimationController, no timers, and no import of the player, the sampler or the motion data.
// It paints with the same `paintMascotFrame` the animated `Buddy` uses, on the state's rest poses,
// so it cannot drift from Buddy's resting frame (docs/renderer-contract.md, section 3).
import 'package:flutter/widgets.dart';

import 'frame.dart';
import 'painter.dart';
import 'states.dart';

/// The OnStage mascot in one of its states, at rest. No animation, no motion data.
///
/// For empty states, lists, sticker-like uses and anywhere motion is unwanted or heavy. It draws
/// exactly the pose [Buddy] starts from; for the animated version use `Buddy` from `mascot.dart`.
class BuddyStatic extends StatelessWidget {
  const BuddyStatic({
    super.key,
    required this.state,
    this.surface = MascotSurface.light,
    this.size = 160,
    this.semanticLabel,
    this.excludeFromSemantics = false,
  });

  /// A state key from spec/states.json, for example `hello` or `no-events`.
  final String state;

  /// `dark` hides the ground shadow.
  final MascotSurface surface;

  /// Width and height in logical pixels.
  final double size;

  /// Semantics label; defaults to the state's name. Pass '' to hide it from assistive technology.
  final String? semanticLabel;

  /// Leave the mascot out of the semantics tree (purely decorative).
  final bool excludeFromSemantics;

  @override
  Widget build(BuildContext context) {
    final def = MascotStates.instance.state(state);
    final name = semanticLabel ?? def.name;
    Widget child = SizedBox.square(
      dimension: size,
      child: RepaintBoundary(
        child: CustomPaint(painter: _StaticPainter(def.key, surface)),
      ),
    );
    child = excludeFromSemantics || name.isEmpty
        ? ExcludeSemantics(child: child)
        : Semantics(label: name, image: true, child: child);
    return child;
  }
}

/// Paints the rest frame of one state. Repaints only when the state or surface changes.
class _StaticPainter extends CustomPainter {
  _StaticPainter(this.key, this.surface)
    : _frame = restFrame(MascotStates.instance.state(key));

  final String key;
  final MascotSurface surface;
  final MascotFrame _frame;

  @override
  void paint(Canvas canvas, Size size) =>
      paintMascotFrame(canvas, size, _frame, surface: surface);

  @override
  bool shouldRepaint(_StaticPainter old) =>
      old.key != key || old.surface != surface;
}

/// The resting frame of [state]: every actor at its rest pose.
MascotFrame restFrame(MascotStateDef state) =>
    MascotFrame(state, [for (final a in state.actors) MascotPose.rest(a)]);

/// Key, group, name and use note of one state.
class MascotStateInfo {
  const MascotStateInfo({
    required this.key,
    required this.group,
    required this.name,
    required this.use,
  });

  final String key, group, name, use;
}

/// All state keys, in board order.
List<String> get mascotStateKeys => MascotStates.instance.stateKeys;

/// Key, group, name and use note of every state, in board order.
List<MascotStateInfo> get mascotStateInfo => [
  for (final s in MascotStates.instance.states)
    MascotStateInfo(key: s.key, group: s.group, name: s.name, use: s.use),
];
