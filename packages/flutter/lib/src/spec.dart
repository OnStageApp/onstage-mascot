// The baked motion clips (spec/motion/<id>.json) and `MascotSpec`, the whole of spec/ format 1 as Dart
// objects: everything in `MascotStates` plus the clips. See spec/README.md and
// docs/renderer-contract.md, section 2. The clips come from motion_data.g.dart (generated from spec/,
// never edited by hand) and each is parsed the first time it is asked for. The static library does
// not import this file.
import 'dart:convert';

import 'motion_data.g.dart' as data;
import 'states.dart';

export 'states.dart';

/// A baked clip (spec/motion/<id>.json).
class MascotClip {
  MascotClip._(Map<String, Object?> m)
    : id = m['id']! as String,
      kind = m['kind']! as String,
      fps = (m['fps']! as num).toDouble(),
      frames = (m['frames']! as num).toInt(),
      loop = m['loop']! as bool,
      introFrames = (m['introFrames'] as num? ?? 0).toInt(),
      duration = (m['duration']! as num).toDouble(),
      fields = List<String>.unmodifiable(m['fields']! as List<Object?>),
      constants = {
        for (final e in (m['constants']! as Map<String, Object?>).entries)
          e.key: (e.value! as num).toDouble(),
      },
      eyeTypes = (m['eyeTypes'] as List<Object?>?)?.cast<String>(),
      mouthTypes = (m['mouthTypes'] as List<Object?>?)?.cast<String>(),
      rows = [
        for (final r in m['rows']! as List<Object?>)
          [for (final v in r! as List<Object?>) (v! as num).toDouble()],
      ] {
    for (var i = 0; i < fields.length; i++) {
      column[fields[i]] = i;
    }
  }

  final String id;

  /// `absolute` or `additive`.
  final String kind;
  final double fps;
  final int frames;
  final bool loop;
  final int introFrames;
  final double duration;
  final List<String> fields;
  final Map<String, double> constants;
  final List<String>? eyeTypes;
  final List<String>? mouthTypes;
  final List<List<double>> rows;

  /// Field name to column index in [rows].
  final Map<String, int> column = {};

  bool get isAbsolute => kind == 'absolute';
}

/// The whole spec: the states of [MascotStates] plus the baked clips. [MascotSpec.instance] shares
/// the states with [MascotStates.instance] and parses each clip the first time it is needed.
class MascotSpec extends MascotStates {
  MascotSpec._(super.base, this._motionSource) : super.from();

  /// Parses JSON texts in the spec/ file formats (for tests and tools).
  factory MascotSpec.fromJson({
    required String palette,
    required String states,
    required Map<String, String> motion,
  }) => MascotSpec._(
    MascotStates.fromJson(palette: palette, states: states),
    motion,
  );

  /// The spec bundled with this package (generated from the repo's spec/).
  static final MascotSpec instance = MascotSpec._(
    MascotStates.instance,
    data.motionJson,
  );

  final Map<String, String> _motionSource;
  final Map<String, MascotClip> _clips = {};

  /// The ids of every bundled clip.
  Iterable<String> get clipIds => _motionSource.keys;

  /// The clip [id], or null when there is none.
  MascotClip? clip(String id) {
    final cached = _clips[id];
    if (cached != null) return cached;
    final src = _motionSource[id];
    if (src == null) return null;
    return _clips[id] = MascotClip._(jsonDecode(src) as Map<String, Object?>);
  }
}
