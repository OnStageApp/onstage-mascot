// The widget. Plays the state's motion once, then idles with random blinks. Pauses while the app
// is not resumed or the subtree's TickerMode is off, and follows MediaQuery.disableAnimations
// unless reducedMotion is given. Same props as the web component.
import 'package:flutter/scheduler.dart';
import 'package:flutter/widgets.dart';

import 'painter.dart';
import 'player.dart';
import 'pose.dart';
import 'spec.dart';

/// The OnStage mascot in one of its states.
class Buddy extends StatefulWidget {
  const Buddy({
    super.key,
    required this.state,
    this.surface = MascotSurface.light,
    this.size = 160,
    this.playOnMount = true,
    this.onDone,
    this.reducedMotion,
    this.label,
    this.random,
  });

  /// A state key from spec/states.json, for example `hello` or `no-events`.
  final String state;
  final MascotSurface surface;

  /// Width and height in logical pixels.
  final double size;

  /// Play the state's motion when it mounts or the state changes. Otherwise start in idle.
  final bool playOnMount;

  /// Called when a once-motion finishes.
  final VoidCallback? onDone;

  /// Force reduced motion on or off; null follows `MediaQuery.disableAnimations`.
  final bool? reducedMotion;

  /// Semantic label; defaults to the state's name. Pass '' to hide from assistive technology.
  final String? label;

  /// Random source in [0, 1) for blinks (default: dart:math Random). Read once, at creation.
  final double Function()? random;

  @override
  State<Buddy> createState() => _BuddyState();
}

class _BuddyState extends State<Buddy>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  MascotPlayer? _player;
  late final Ticker _ticker = createTicker(_onTick);
  Duration? _last;
  bool _appActive = true;
  bool _tickerEnabled = true;

  bool get _reduced =>
      widget.reducedMotion ??
      (MediaQuery.maybeDisableAnimationsOf(context) ?? false);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    final s = WidgetsBinding.instance.lifecycleState;
    _appActive = s == null || s == AppLifecycleState.resumed;
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final enabled = TickerMode.valuesOf(context).enabled;
    if (enabled != _tickerEnabled) {
      _tickerEnabled = enabled;
      _last = null; // contract 9.5: after a pause the next dt is 0
    }
    final p = _player;
    if (p == null) {
      _create();
    } else {
      p.setReducedMotion(_reduced);
      _sync();
    }
  }

  @override
  void didUpdateWidget(Buddy old) {
    super.didUpdateWidget(old);
    if (old.state != widget.state || old.playOnMount != widget.playOnMount) {
      _player?.dispose();
      _create();
    } else {
      _player?.setReducedMotion(_reduced);
      _sync();
    }
  }

  void _create() {
    _player = MascotPlayer(
      state: widget.state,
      playOnMount: widget.playOnMount,
      reducedMotion: _reduced,
      random: widget.random,
      onDone: () => widget.onDone?.call(),
    );
    _last = null;
    _sync();
  }

  /// Runs the ticker exactly when the player needs it and the app is visible.
  void _sync() {
    final run = (_player?.isAnimating ?? false) && _appActive;
    if (run && !_ticker.isActive) {
      _last = null;
      _ticker.start();
    } else if (!run && _ticker.isActive) {
      _ticker.stop();
    }
  }

  void _onTick(Duration elapsed) {
    final last = _last;
    _last = elapsed;
    final dt = last == null
        ? 0.0
        : (elapsed - last).inMicroseconds / Duration.microsecondsPerSecond;
    _player?.advance(dt);
    if (!(_player?.isAnimating ?? false)) _sync();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _appActive = state == AppLifecycleState.resumed;
    _sync();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _ticker.dispose();
    _player?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final player = _player!;
    final name = widget.label ?? player.state.name;
    Widget child = SizedBox.square(
      dimension: widget.size,
      child: RepaintBoundary(
        child: CustomPaint(
          painter: MascotPainter(
            frameOf: _frameOf(player),
            surface: widget.surface,
            repaint: player,
          ),
        ),
      ),
    );
    child = name.isEmpty
        ? ExcludeSemantics(child: child)
        : Semantics(label: name, image: true, child: child);
    return child;
  }

  // One closure per player, so shouldRepaint only fires when the player or surface changes.
  final Expando<MascotFrame Function()> _frameOfCache = Expando();
  MascotFrame Function() _frameOf(MascotPlayer p) =>
      _frameOfCache[p] ??= () => p.frame;
}
