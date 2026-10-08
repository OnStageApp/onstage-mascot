// The states half of spec/ format 1 as Dart objects: palette, canvas, ground and the 85 states
// (scene, rest poses, motion references). See spec/README.md and docs/renderer-contract.md, section 2.
// The data comes from states_data.g.dart (generated from spec/, never edited by hand) and is parsed
// on first use. This file does not import the motion data: the static library (static.dart) builds
// on it alone. The baked clips and `MascotSpec` live in spec.dart.
import 'dart:convert';
import 'dart:ui' show Color;

import 'states_data.g.dart' as data;

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

/// The palette, canvas, ground and states of the spec, without the baked motion clips.
/// [MascotStates.instance] is parsed from the generated data on first use.
class MascotStates {
  MascotStates._({
    required this.canvasWidth,
    required this.canvasHeight,
    required this.ground,
    required this.idleMotion,
    required this.idleActorOffset,
    required this.blink,
    required this.surfaces,
    required this.states,
    required Map<String, MascotStateDef> byKey,
  }) : _byKey = byKey;

  /// Shares everything with [other]; used by [MascotSpec] to add the clips to the same parsed states.
  MascotStates.from(MascotStates other)
    : canvasWidth = other.canvasWidth,
      canvasHeight = other.canvasHeight,
      ground = other.ground,
      idleMotion = other.idleMotion,
      idleActorOffset = other.idleActorOffset,
      blink = other.blink,
      surfaces = other.surfaces,
      states = other.states,
      _byKey = other._byKey;

  /// Parses decoded palette.json and states.json documents.
  factory MascotStates.parse(
    Map<String, Object?> palette,
    Map<String, Object?> states,
  ) {
    final canvas = states['canvas']! as Map<String, Object?>;
    final idle = states['idle']! as Map<String, Object?>;
    final list = List<MascotStateDef>.unmodifiable(
      (states['states']! as List<Object?>).map(
        (s) => _state(s! as Map<String, Object?>),
      ),
    );
    return MascotStates._(
      canvasWidth: (canvas['width']! as num).toDouble(),
      canvasHeight: (canvas['height']! as num).toDouble(),
      ground: (states['ground']! as num).toDouble(),
      idleMotion: idle['motion']! as String,
      idleActorOffset: (idle['actorOffset']! as num).toDouble(),
      blink: _blink(states['blink']! as Map<String, Object?>),
      surfaces: {
        for (final s in MascotSurface.values)
          s: MascotColors._parse(
            (palette['surfaces']! as Map<String, Object?>)[s.name]!
                as Map<String, Object?>,
          ),
      },
      states: list,
      byKey: {for (final s in list) s.key: s},
    );
  }

  /// Parses JSON texts in the palette.json and states.json formats (for tests and tools).
  factory MascotStates.fromJson({
    required String palette,
    required String states,
  }) => MascotStates.parse(
    jsonDecode(palette) as Map<String, Object?>,
    jsonDecode(states) as Map<String, Object?>,
  );

  /// The states bundled with this package (generated from the repo's spec/).
  static final MascotStates instance = MascotStates.fromJson(
    palette: data.paletteJson,
    states: data.statesJson,
  );

  final double canvasWidth, canvasHeight, ground;
  final String idleMotion;
  final double idleActorOffset;
  final BlinkParams blink;
  final Map<MascotSurface, MascotColors> surfaces;

  /// All states, in board order.
  final List<MascotStateDef> states;

  final Map<String, MascotStateDef> _byKey;

  /// All state keys, in board order.
  List<String> get stateKeys => [for (final s in states) s.key];

  /// The state named [key]. Throws for an unknown key.
  MascotStateDef state(String key) {
    final s = _byKey[key];
    if (s == null) throw ArgumentError('Unknown mascot state "$key"');
    return s;
  }

  /// Whether [key] names a state.
  bool hasState(String key) => _byKey.containsKey(key);

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
