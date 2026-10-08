// A character pose and a frame (the poses of a scene). Data only: no sampling and no clips, so the
// painter and the static library can use them without the motion data. Sampling is in pose.dart.
import 'states.dart';

/// A character pose in body units (the tile is 64 by 54). Numbers by field name, plus the eye and
/// mouth types with their crossfade state.
class MascotPose {
  MascotPose._(
    this.values, {
    required this.eyeL,
    required this.eyeR,
    required this.mouth,
    this.eyeLPrev,
    this.eyeRPrev,
    this.mouthPrev,
  });

  /// The rest pose of [actor]: Prev null, Fade 1.
  factory MascotPose.rest(MascotActor actor) {
    final v = <String, double>{};
    actor.rest.forEach((k, val) {
      if (val is double) v[k] = val;
    });
    v['eyeLFade'] = 1;
    v['eyeRFade'] = 1;
    v['mouthFade'] = 1;
    return MascotPose._(
      v,
      eyeL: actor.rest['eyeL']! as String,
      eyeR: actor.rest['eyeR']! as String,
      mouth: actor.rest['mouth']! as String,
    );
  }

  /// Numeric fields (contract section 2), including `eyeLFade`, `eyeRFade` and `mouthFade`.
  final Map<String, double> values;
  String eyeL, eyeR, mouth;
  String? eyeLPrev, eyeRPrev, mouthPrev;

  /// A numeric field; 0 when absent.
  double operator [](String field) => values[field] ?? 0;
  void operator []=(String field, double v) => values[field] = v;

  double get eyeLFade => this['eyeLFade'];
  double get eyeRFade => this['eyeRFade'];
  double get mouthFade => this['mouthFade'];

  /// The type, previous type and fade of track [track] (`eyeL`, `eyeR` or `mouth`).
  (String, String?, double) track(String track) => switch (track) {
    'eyeL' => (eyeL, eyeLPrev, eyeLFade),
    'eyeR' => (eyeR, eyeRPrev, eyeRFade),
    _ => (mouth, mouthPrev, mouthFade),
  };

  MascotPose copy() => MascotPose._(
    Map.of(values),
    eyeL: eyeL,
    eyeR: eyeR,
    mouth: mouth,
    eyeLPrev: eyeLPrev,
    eyeRPrev: eyeRPrev,
    mouthPrev: mouthPrev,
  );

  @override
  String toString() =>
      'MascotPose(eyeL: $eyeL/$eyeLPrev, eyeR: $eyeR/$eyeRPrev, mouth: $mouth/$mouthPrev, $values)';
}

/// One frame of a state: the state and every actor's pose. What the painter draws.
class MascotFrame {
  const MascotFrame(this.state, this.poses);
  final MascotStateDef state;
  final List<MascotPose> poses;
}
