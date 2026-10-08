// Frame resolution: which pose each actor has at a given phase and time. Pure, no widgets.
// Follows docs/renderer-contract.md sections 7 (sampling), 8 (combining) and 9.1 (phases).
import 'dart:math' as math;

import 'frame.dart';
import 'spec.dart';

export 'frame.dart';

/// The three player phases (contract section 9.1).
enum MascotPhase { rest, motion, idle }

const Set<String> _add = {
  'x',
  'y',
  'tilt',
  'edx',
  'edy',
  'mdx',
  'mdy',
  'footL',
  'footR',
  'footLRot',
  'footRRot',
  'aLang',
  'aRang',
};
const Set<String> _mul = {'sx', 'sy', 'blink'};
const List<String> _tracks = ['eyeL', 'eyeR', 'mouth'];
const Set<String> _discrete = {
  'eyeL',
  'eyeLPrev',
  'eyeLFade',
  'eyeR',
  'eyeRPrev',
  'eyeRFade',
  'mouth',
  'mouthPrev',
  'mouthFade',
};

/// The two rows a time falls between and the weight of the second: contract section 7, `locate`.
(int, int, double) locate(MascotClip clip, double t) {
  final n = clip.frames;
  final fps = clip.fps;
  if (!clip.loop) {
    final u = (t * fps).clamp(0, n - 1).toDouble();
    final i0 = u.floor();
    return (i0, math.min(i0 + 1, n - 1), u - i0);
  }
  final intro = clip.introFrames;
  final l = n - intro;
  final u = math.max(0, t * fps).toDouble();
  if (u < intro) {
    final i0 = u.floor();
    return (i0, i0 + 1, u - i0);
  }
  final v = (u - intro) % l;
  final j0 = v.floor();
  return (intro + j0, intro + (j0 + 1) % l, v - j0);
}

/// Contract section 7, `mixDiscrete`: (type, prev, fade) between two rows.
(int, int, double) mixDiscrete(
  int t0,
  int p0,
  double f0,
  int t1,
  int p1,
  double f1,
  double a,
) {
  if (a <= 0) return (t0, p0, f0);
  if (t0 == t1 && p0 == p1) return (t0, p0, f0 + (f1 - f0) * a);
  if (p1 == t0) return (t1, p1, f1 * a);
  return a < 0.5 ? (t0, p0, f0) : (t1, p1, f1);
}

/// One sample of a clip: numbers by field, discrete tracks as (type, prev, fade).
class ClipSample {
  ClipSample(this.numbers, this.tracks);
  final Map<String, double> numbers;
  final Map<String, (String, String?, double)> tracks;
}

/// The clip's values at [t] seconds (contract section 7, `sample`).
ClipSample sampleClip(MascotClip clip, double t) {
  final (i0, i1, a) = locate(clip, t);
  final r0 = clip.rows[i0];
  final r1 = clip.rows[i1];
  final col = clip.column;
  final numbers = <String, double>{};
  clip.constants.forEach((k, v) {
    if (!_discrete.contains(k)) numbers[k] = v;
  });
  for (final f in clip.fields) {
    if (_discrete.contains(f)) continue;
    final k = col[f]!;
    numbers[f] = r0[k] + (r1[k] - r0[k]) * a;
  }
  final tracks = <String, (String, String?, double)>{};
  for (final tr in _tracks) {
    if (!col.containsKey(tr) && !clip.constants.containsKey(tr)) continue;
    final table = tr == 'mouth' ? clip.mouthTypes! : clip.eyeTypes!;
    double get(List<double> r, String k) {
      final c = col[k];
      return c != null ? r[c] : clip.constants[k]!;
    }

    final (ty, pv, fd) = mixDiscrete(
      get(r0, tr).toInt(),
      get(r0, '${tr}Prev').toInt(),
      get(r0, '${tr}Fade'),
      get(r1, tr).toInt(),
      get(r1, '${tr}Prev').toInt(),
      get(r1, '${tr}Fade'),
      a,
    );
    tracks[tr] = (table[ty], pv < 0 ? null : table[pv], fd);
  }
  return ClipSample(numbers, tracks);
}

/// The rest pose of [actor] combined with a clip sample (contract section 8): absolute clips replace
/// fields, additive clips offset or scale them.
MascotPose applySample(MascotActor actor, MascotClip clip, ClipSample s) {
  final p = MascotPose.rest(actor);
  if (clip.isAbsolute) {
    s.numbers.forEach((k, v) => p[k] = v);
    s.tracks.forEach((tr, v) => _setTrack(p, tr, v.$1, v.$2, v.$3));
  } else {
    s.numbers.forEach((k, v) {
      if (_add.contains(k)) {
        p[k] = p[k] + v;
      } else if (_mul.contains(k)) {
        p[k] = p[k] * v;
      }
    });
  }
  return p;
}

void _setTrack(
  MascotPose p,
  String track,
  String type,
  String? prev,
  double fade,
) {
  switch (track) {
    case 'eyeL':
      p.eyeL = type;
      p.eyeLPrev = prev;
    case 'eyeR':
      p.eyeR = type;
      p.eyeRPrev = prev;
    default:
      p.mouth = type;
      p.mouthPrev = prev;
  }
  p['${track}Fade'] = fade;
}

/// The clip [phase] plays for [state], or null for the rest phase.
MascotClip? clipFor(
  MascotStateDef state,
  MascotPhase phase, [
  MascotSpec? spec,
]) {
  final sp = spec ?? MascotSpec.instance;
  return switch (phase) {
    MascotPhase.motion => sp.clip(state.motion.id),
    MascotPhase.idle => sp.clip(sp.idleMotion),
    MascotPhase.rest => null,
  };
}

/// Every actor's pose at [t] seconds into [phase] (contract section 9.1). [blink] is a per-actor
/// factor on eye height (1 = open). Pure: the same input always gives the same poses.
List<MascotPose> resolvePoses(
  MascotStateDef state,
  MascotPhase phase,
  double t, {
  List<double>? blink,
  MascotSpec? spec,
}) {
  final sp = spec ?? MascotSpec.instance;
  final clip = clipFor(state, phase, sp);
  return [
    for (var i = 0; i < state.actors.length; i++)
      _actorPose(state, i, clip, phase, t, blink, sp),
  ];
}

MascotPose _actorPose(
  MascotStateDef state,
  int i,
  MascotClip? clip,
  MascotPhase phase,
  double t,
  List<double>? blink,
  MascotSpec sp,
) {
  final actor = state.actors[i];
  var pose = MascotPose.rest(actor);
  if (clip != null && phase == MascotPhase.motion) {
    final offset = state.motion.actors[i];
    if (offset != null && t - offset >= 0) {
      pose = applySample(actor, clip, sampleClip(clip, t - offset));
    }
  } else if (clip != null && phase == MascotPhase.idle) {
    pose = applySample(
      actor,
      clip,
      sampleClip(clip, t + i * sp.idleActorOffset),
    );
  }
  final b = (blink != null && i < blink.length) ? blink[i] : 1.0;
  if (b != 1) pose['blink'] = pose['blink'] * b;
  return pose;
}

/// Pure: the frame of state [key] at [t] seconds into [phase], or at a 30 fps [frame] index (the
/// clip's fps; fractional allowed) when [t] is null. Same rules as the web `renderFrameSvg`.
MascotFrame computeFrame(
  String key, {
  MascotPhase phase = MascotPhase.rest,
  double? t,
  double? frame,
  List<double>? blink,
  MascotSpec? spec,
}) {
  final sp = spec ?? MascotSpec.instance;
  final state = sp.state(key);
  final clip = clipFor(state, phase, sp);
  final time = t ?? (frame != null && clip != null ? frame / clip.fps : 0.0);
  return MascotFrame(
    state,
    resolvePoses(state, phase, time, blink: blink, spec: sp),
  );
}
