// spec/ format 1 as Dart objects. See spec/README.md and docs/renderer-contract.md, section 2.
// The data comes from spec_data.g.dart (generated from spec/, never edited by hand) and is parsed
// lazily: palette and states on first use, each motion clip the first time it is asked for.
import 'dart:convert';
import 'dart:ui' show Color;

import 'spec_data.g.dart' as data;

/// The two surfaces a scene can be drawn on.
enum MascotSurface { light, dark }

/// A palette surface: token name to colour, or null for "do not draw".
class MascotColors {
  MascotColors._(this._tokens);

  final Map<String, Color?> _tokens;

  /// The colour of [token], or null when the token is hidden on this surface.
  /// Throws for a token the palette does not know.
  Color? operator [](String token) {
    if (!_tokens.containsKey(token)) {
      throw ArgumentError('mascot: unknown palette token "$token"');
    }
    return _tokens[token];
  }

  /// Whether [token] names a palette token.
  bool has(String token) => _tokens.containsKey(token);

  static MascotColors _parse(Map<String, Object?> m) => MascotColors._({
    for (final e in m.entries)
      e.key: e.value == null ? null : _hex(e.value! as String),
  });

  static Color _hex(String s) {
    final h = s.startsWith('#') ? s.substring(1) : s;
    if (h.length != 6) throw FormatException('mascot: bad colour "$s"');
    return Color(0xFF000000 | int.parse(h, radix: 16));
  }
}

/// One op of a prop transform: translate, scale or rotate (degrees, about a pivot).
class TransformOp {
  const TransformOp(this.kind, this.a, this.b, [this.c = 0]);

  /// `translate`, `scale` or `rotate`.
  final String kind;
  final double a;
  final double b;
  final double c;

  static TransformOp _parse(List<Object?> l) {
    double n(int i) => i < l.length ? (l[i]! as num).toDouble() : 0;
    return TransformOp(l[0]! as String, n(1), n(2), n(3));
  }
}

/// A scene layer: an actor reference or a prop primitive.
sealed class MascotLayer {
  const MascotLayer();

  static MascotLayer parse(Map<String, Object?> m) {
    final type = m['type']! as String;
    if (type == 'actor') return ActorLayer((m['actor']! as num).toInt());
    final transform = (m['transform'] as List<Object?>?)
        ?.map((o) => TransformOp._parse(o! as List<Object?>))
        .toList(growable: false);
    if (type == 'group') {
      return GroupPrim(
        transform: transform,
        children: (m['children']! as List<Object?>)
            .map((c) => MascotLayer.parse(c! as Map<String, Object?>))
            .toList(growable: false),
      );
    }
    double d(String k) => (m[k]! as num).toDouble();
    final paint = PrimPaint(
      fill: m['fill'] as String?,
      stroke: m['stroke'] as String?,
      strokeWidth: (m['strokeWidth'] as num?)?.toDouble() ?? 1,
      cap: m['cap'] as String? ?? 'butt',
      join: m['join'] as String? ?? 'miter',
    );
    switch (type) {
      case 'rect':
        return RectPrim(
          d('x'),
          d('y'),
          d('w'),
          d('h'),
          d('rx'),
          d('ry'),
          paint: paint,
          transform: transform,
        );
      case 'circle':
        return EllipsePrim(
          d('cx'),
          d('cy'),
          d('r'),
          d('r'),
          paint: paint,
          transform: transform,
          isCircle: true,
        );
      case 'ellipse':
        return EllipsePrim(
          d('cx'),
          d('cy'),
          d('rx'),
          d('ry'),
          paint: paint,
          transform: transform,
        );
      case 'path':
        return PathPrim(m['d']! as String, paint: paint, transform: transform);
    }
    throw FormatException('mascot: unknown layer type "$type"');
  }
}

/// Places actor [actor] (with its ground shadow) at this point of the draw order.
class ActorLayer extends MascotLayer {
  const ActorLayer(this.actor);
  final int actor;
}

/// Fill and stroke tokens of a primitive (section 6 of the contract).
class PrimPaint {
  const PrimPaint({
    this.fill,
    this.stroke,
    this.strokeWidth = 1,
    this.cap = 'butt',
    this.join = 'miter',
  });

  final String? fill;
  final String? stroke;
  final double strokeWidth;
  final String cap;
  final String join;
}

/// A prop primitive with an optional transform.
sealed class Prim extends MascotLayer {
  const Prim({this.transform});
  final List<TransformOp>? transform;
}

class RectPrim extends Prim {
  const RectPrim(
    this.x,
    this.y,
    this.w,
    this.h,
    this.rx,
    this.ry, {
    required this.paint,
    super.transform,
  });
  final double x, y, w, h, rx, ry;
  final PrimPaint paint;
}

class EllipsePrim extends Prim {
  const EllipsePrim(
    this.cx,
    this.cy,
    this.rx,
    this.ry, {
    required this.paint,
    super.transform,
    this.isCircle = false,
  });
  final double cx, cy, rx, ry;
  final PrimPaint paint;
  final bool isCircle;
}

class PathPrim extends Prim {
  const PathPrim(this.d, {required this.paint, super.transform});

  /// Absolute M, L, C, Z only.
  final String d;
  final PrimPaint paint;
}

class GroupPrim extends Prim {
  const GroupPrim({required this.children, super.transform});
  final List<MascotLayer> children;
}

/// A Buddy placed in a scene: centre [cx], tile bottom [by], scale [s] (scene units).
class MascotActor {
  const MascotActor({
    required this.cx,
    required this.by,
    required this.s,
    required this.shadow,
    required this.rest,
  });

  final double cx, by, s;
  final bool shadow;

  /// The resting pose: numbers by field, plus `eyeL`, `eyeR` and `mouth` type names.
  final Map<String, Object?> rest;
}

/// Which clip a state's motion phase plays and which actors it drives.
class MotionRef {
  const MotionRef({
    required this.id,
    required this.plays,
    required this.then,
    required this.actors,
  });

  final String id;

  /// `once` or `loop`.
  final String plays;

  /// `idle`, or null for loops.
  final String? then;

  /// MascotActor index to start offset in seconds.
  final Map<int, double> actors;

  bool get isLoop => plays == 'loop';
}

/// One of the 85 states.
class MascotStateDef {
  const MascotStateDef({
    required this.key,
    required this.group,
    required this.name,
    required this.use,
    required this.actors,
    required this.layers,
    required this.motion,
  });

  final String key, group, name, use;
  final List<MascotActor> actors;
  final List<MascotLayer> layers;
  final MotionRef motion;
}

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

/// Blink scheduling parameters (states.json `blink`).
class BlinkParams {
  const BlinkParams({
    required this.motion,
    required this.gapMin,
    required this.gapMax,
    required this.doubleChance,
    required this.doubleGap,
  });

  final String motion;
  final double gapMin, gapMax, doubleChance, doubleGap;
}

/// The whole spec. [MascotSpec.instance] is parsed from the generated data on first use.
class MascotSpec {
  MascotSpec._(
    Map<String, Object?> palette,
    Map<String, Object?> states,
    this._motionSource,
  ) : canvasWidth =
          ((states['canvas']! as Map<String, Object?>)['width']! as num)
              .toDouble(),
      canvasHeight =
          ((states['canvas']! as Map<String, Object?>)['height']! as num)
              .toDouble(),
      ground = (states['ground']! as num).toDouble(),
      idleMotion =
          (states['idle']! as Map<String, Object?>)['motion']! as String,
      idleActorOffset =
          ((states['idle']! as Map<String, Object?>)['actorOffset']! as num)
              .toDouble(),
      blink = _blink(states['blink']! as Map<String, Object?>),
      surfaces = {
        for (final s in MascotSurface.values)
          s: MascotColors._parse(
            (palette['surfaces']! as Map<String, Object?>)[s.name]!
                as Map<String, Object?>,
          ),
      },
      states = List.unmodifiable(
        (states['states']! as List<Object?>).map(
          (s) => _state(s! as Map<String, Object?>),
        ),
      ) {
    for (final s in this.states) {
      _byKey[s.key] = s;
    }
  }

  /// Parses JSON texts in the spec/ file formats (for tests and tools).
  factory MascotSpec.fromJson({
    required String palette,
    required String states,
    required Map<String, String> motion,
  }) => MascotSpec._(
    jsonDecode(palette) as Map<String, Object?>,
    jsonDecode(states) as Map<String, Object?>,
    motion,
  );

  /// The spec bundled with this package (generated from the repo's spec/).
  static final MascotSpec instance = MascotSpec.fromJson(
    palette: data.paletteJson,
    states: data.statesJson,
    motion: data.motionJson,
  );

  final double canvasWidth, canvasHeight, ground;
  final String idleMotion;
  final double idleActorOffset;
  final BlinkParams blink;
  final Map<MascotSurface, MascotColors> surfaces;

  /// All states, in board order.
  final List<MascotStateDef> states;

  final Map<String, MascotStateDef> _byKey = {};
  final Map<String, String> _motionSource;
  final Map<String, MascotClip> _clips = {};

  /// All state keys, in board order.
  List<String> get stateKeys => [for (final s in states) s.key];

  /// The ids of every bundled clip.
  Iterable<String> get clipIds => _motionSource.keys;

  /// The state named [key]. Throws for an unknown key.
  MascotStateDef state(String key) {
    final s = _byKey[key];
    if (s == null) throw ArgumentError('Unknown mascot state "$key"');
    return s;
  }

  /// Whether [key] names a state.
  bool hasState(String key) => _byKey.containsKey(key);

  /// The clip [id], or null when there is none.
  MascotClip? clip(String id) {
    final cached = _clips[id];
    if (cached != null) return cached;
    final src = _motionSource[id];
    if (src == null) return null;
    return _clips[id] = MascotClip._(jsonDecode(src) as Map<String, Object?>);
  }

  static BlinkParams _blink(Map<String, Object?> m) => BlinkParams(
    motion: m['motion']! as String,
    gapMin: (m['gapMin']! as num).toDouble(),
    gapMax: (m['gapMax']! as num).toDouble(),
    doubleChance: (m['doubleChance']! as num).toDouble(),
    doubleGap: (m['doubleGap']! as num).toDouble(),
  );

  static MascotStateDef _state(Map<String, Object?> m) {
    final motion = m['motion']! as Map<String, Object?>;
    return MascotStateDef(
      key: m['key']! as String,
      group: m['group']! as String,
      name: m['name']! as String,
      use: m['use'] as String? ?? '',
      actors: [
        for (final a in m['actors']! as List<Object?>)
          _actor(a! as Map<String, Object?>),
      ],
      layers: [
        for (final l in m['layers']! as List<Object?>)
          MascotLayer.parse(l! as Map<String, Object?>),
      ],
      motion: MotionRef(
        id: motion['id']! as String,
        plays: motion['plays']! as String,
        then: motion['then'] as String?,
        actors: {
          for (final a
              in (motion['actors']! as List<Object?>)
                  .cast<Map<String, Object?>>())
            (a['actor']! as num).toInt(): (a['offset']! as num).toDouble(),
        },
      ),
    );
  }

  static MascotActor _actor(Map<String, Object?> m) => MascotActor(
    cx: (m['cx']! as num).toDouble(),
    by: (m['by']! as num).toDouble(),
    s: (m['s']! as num).toDouble(),
    shadow: m['shadow'] as bool? ?? false,
    rest: {
      for (final e in (m['rest']! as Map<String, Object?>).entries)
        e.key: e.value is num ? (e.value! as num).toDouble() : e.value,
    },
  );
}
