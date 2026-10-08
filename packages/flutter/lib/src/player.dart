// The player: owns the clock, the phase machine and the blink schedule, and produces one frame per
// tick. No widgets and no Ticker here, so tests drive it with advance(dt) exactly like the web
// player's advance(). docs/renderer-contract.md section 9.
import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';

import 'pose.dart';
import 'spec.dart';

/// The longest step one tick may advance the clock (contract 9.2).
const double maxDt = 0.1;

/// A frame source for one state. Notifies listeners after every render.
class MascotPlayer extends ChangeNotifier {
  MascotPlayer({
    required String state,
    bool playOnMount = true,
    bool reducedMotion = false,
    this.onDone,
    double Function()? random,
    MascotSpec? spec,
  }) : _spec = spec ?? MascotSpec.instance,
       _random = random ?? math.Random().nextDouble,
       _reduced = reducedMotion {
    _st = _spec.state(state);
    _start(playOnMount);
  }

  final MascotSpec _spec;
  final double Function() _random;

  /// Called when a once-motion finishes (and, asynchronously, right away under reduced motion).
  VoidCallback? onDone;

  late MascotStateDef _st;
  bool _reduced;
  MascotPhase _phase = MascotPhase.rest;
  double _t = 0;
  double _end = 0;
  List<double> _blinkNext = const [];
  List<double> _blinkStart = const [];
  late MascotFrame _frame;
  bool _disposed = false;

  MascotStateDef get state => _st;
  MascotPhase get phase => _phase;

  /// Seconds into the current phase.
  double get time => _t;
  bool get reducedMotion => _reduced;

  /// The current frame.
  MascotFrame get frame => _frame;

  /// Whether the clock needs ticking (the frame loop stops in rest and under reduced motion).
  bool get isAnimating => !_reduced && _phase != MascotPhase.rest;

  double _gap() {
    final b = _spec.blink;
    return b.gapMin + (b.gapMax - b.gapMin) * _random();
  }

  bool get _blinks =>
      _phase == MascotPhase.idle ||
      (_phase == MascotPhase.motion && _st.motion.isLoop);

  void _initBlinks() {
    final n = _st.actors.length;
    _blinkStart = List.filled(n, double.negativeInfinity);
    _blinkNext = [for (var i = 0; i < n; i++) _t + _gap()];
  }

  /// Contract 9.3 `blinkFactor`, actors in index order. Consumes random numbers, so it runs exactly
  /// once per render.
  List<double>? _blinkFactors() {
    final clip = _spec.clip(_spec.blink.motion);
    if (!_blinks || clip == null) return null;
    final b = _spec.blink;
    return [
      for (var i = 0; i < _st.actors.length; i++) _blinkFactor(i, clip, b),
    ];
  }

  double _blinkFactor(int i, MascotClip clip, BlinkParams b) {
    while (_t >= _blinkNext[i]) {
      _blinkStart[i] = _blinkNext[i];
      _blinkNext[i] =
          _blinkStart[i] + (_random() < b.doubleChance ? b.doubleGap : _gap());
    }
    final d = _t - _blinkStart[i];
    return d >= 0 && d <= clip.duration
        ? sampleClip(clip, d).numbers['blink']!
        : 1;
  }

  void _render() {
    _frame = MascotFrame(
      _st,
      resolvePoses(_st, _phase, _t, blink: _blinkFactors(), spec: _spec),
    );
    if (!_disposed) notifyListeners();
  }

  void _enterIdle() {
    _phase = MascotPhase.idle;
    _t = 0;
    _initBlinks();
  }

  void _start(bool play) {
    _t = 0;
    if (_reduced) {
      _phase = MascotPhase.rest;
      _render();
      if (play && !_st.motion.isLoop) {
        scheduleMicrotask(() {
          if (!_disposed) onDone?.call();
        });
      }
      return;
    }
    if (play) {
      _phase = MascotPhase.motion;
      final clip = _spec.clip(_st.motion.id);
      _end =
          (clip?.duration ?? 0) +
          _st.motion.actors.values.fold<double>(0, math.max);
      if (_st.motion.isLoop) _initBlinks();
    } else {
      _enterIdle();
    }
    _render();
  }

  /// Advances the clock by [dt] seconds (clamped to 0..0.1) and renders (contract 9.2 `tick`).
  /// Does nothing under reduced motion.
  void advance(double dt) {
    if (_disposed || _reduced) return;
    _t += dt.clamp(0, maxDt).toDouble();
    if (_phase == MascotPhase.motion && !_st.motion.isLoop && _t >= _end) {
      if (_st.motion.then == 'idle') {
        _enterIdle();
      } else {
        _phase = MascotPhase.rest;
        _t = 0;
      }
      onDone?.call();
    }
    _render();
  }

  /// Restarts the current state's motion.
  void play() => _start(true);

  /// Switches to state [key] and starts it (its motion when [play], else idle).
  void setState(String key, {bool play = true}) {
    _st = _spec.state(key);
    _start(play);
  }

  /// Contract 9.4: on jumps to rest, off starts idle.
  void setReducedMotion(bool on) {
    if (on == _reduced) return;
    _reduced = on;
    if (on) {
      _phase = MascotPhase.rest;
      _t = 0;
      _render();
    } else {
      _start(false);
    }
  }

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }
}
