// Draws a resolved frame on a Canvas. Geometry and draw order follow docs/renderer-contract.md
// sections 3 to 6 exactly; keep the two in step. No motion logic here: poses come in ready.
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/rendering.dart' hide Layer;

import 'frame.dart';
import 'states.dart';

double _rad(double deg) => deg * math.pi / 180;

/// Paints [frame] into a [size] square box at the canvas origin (the 240 by 240 scene scaled
/// uniformly to `size.shortestSide`). [background] is a palette token or a colour painted behind
/// the scene; omit it for transparent. Content outside the canvas is clipped.
void paintMascotFrame(
  Canvas canvas,
  Size size,
  MascotFrame frame, {
  MascotSurface surface = MascotSurface.light,
  Object? background,
  MascotStates? spec,
}) {
  final sp = spec ?? MascotStates.instance;
  final c = sp.surfaces[surface]!;
  final w = sp.canvasWidth;
  final h = sp.canvasHeight;
  final k = size.shortestSide / w;
  canvas
    ..save()
    ..clipRect(Offset.zero & size)
    ..scale(k, k);
  final scene = Rect.fromLTWH(0, 0, w, h);
  final Color? bg = switch (background) {
    final String token when c.has(token) => c[token],
    final Color color => color,
    null => null,
    _ => throw ArgumentError('mascot: background must be a token or a Color'),
  };
  if (bg != null) canvas.drawRect(scene, Paint()..color = bg);
  for (final layer in frame.state.layers) {
    _layer(canvas, c, layer, frame, sp);
  }
  canvas.restore();
}

void _layer(
  Canvas canvas,
  MascotColors c,
  MascotLayer layer,
  MascotFrame frame,
  MascotStates sp,
) {
  switch (layer) {
    case ActorLayer(:final actor):
      _actor(canvas, c, frame.state.actors[actor], frame.poses[actor], sp);
    case final Prim p:
      _prim(canvas, c, p, frame, sp);
  }
}

// ---------------- props (section 5) ----------------

void _applyTransform(Canvas canvas, List<TransformOp>? ops) {
  if (ops == null) return;
  for (final o in ops) {
    switch (o.kind) {
      case 'translate':
        canvas.translate(o.a, o.b);
      case 'scale':
        canvas.scale(o.a, o.b);
      case 'rotate':
        canvas
          ..translate(o.b, o.c)
          ..rotate(_rad(o.a))
          ..translate(-o.b, -o.c);
      default:
        throw ArgumentError('mascot: unknown transform "${o.kind}"');
    }
  }
}

/// Fill and stroke paints for a primitive, or null when nothing is visible (section 6).
(Paint?, Paint?)? _paints(MascotColors c, PrimPaint p) {
  final fill = p.fill == null ? null : c[p.fill!];
  final stroke = p.stroke == null ? null : c[p.stroke!];
  if (fill == null && stroke == null) return null;
  return (
    fill == null
        ? null
        : (Paint()
            ..color = fill
            ..isAntiAlias = true),
    stroke == null
        ? null
        : (Paint()
            ..color = stroke
            ..isAntiAlias = true
            ..style = PaintingStyle.stroke
            ..strokeWidth = p.strokeWidth
            ..strokeCap = switch (p.cap) {
              'round' => StrokeCap.round,
              'square' => StrokeCap.square,
              _ => StrokeCap.butt,
            }
            ..strokeJoin = switch (p.join) {
              'round' => StrokeJoin.round,
              'bevel' => StrokeJoin.bevel,
              _ => StrokeJoin.miter,
            }
            ..strokeMiterLimit = 4),
  );
}

void _prim(
  Canvas canvas,
  MascotColors c,
  Prim p,
  MascotFrame frame,
  MascotStates sp,
) {
  canvas.save();
  _applyTransform(canvas, p.transform);
  switch (p) {
    case GroupPrim(:final children):
      for (final ch in children) {
        _layer(canvas, c, ch, frame, sp);
      }
    case RectPrim():
      final paints = _paints(c, p.paint);
      if (paints != null) {
        final r = Rect.fromLTWH(p.x, p.y, p.w, p.h);
        final rr = RRect.fromRectXY(r, p.rx, p.ry);
        for (final paint in [paints.$1, paints.$2]) {
          if (paint == null) continue;
          if (p.rx > 0 && p.ry > 0) {
            canvas.drawRRect(rr, paint);
          } else {
            canvas.drawRect(r, paint);
          }
        }
      }
    case EllipsePrim():
      final paints = _paints(c, p.paint);
      if (paints != null) {
        for (final paint in [paints.$1, paints.$2]) {
          if (paint == null) continue;
          if (p.isCircle) {
            canvas.drawCircle(Offset(p.cx, p.cy), p.rx, paint);
          } else {
            canvas.drawOval(
              Rect.fromCenter(
                center: Offset(p.cx, p.cy),
                width: p.rx * 2,
                height: p.ry * 2,
              ),
              paint,
            );
          }
        }
      }
    case PathPrim():
      final paints = _paints(c, p.paint);
      if (paints != null) {
        final path = parsePathData(p.d);
        for (final paint in [paints.$1, paints.$2]) {
          if (paint != null) canvas.drawPath(path, paint);
        }
      }
  }
  canvas.restore();
}

final Map<String, Path> _pathCache = {};

/// Parses path data restricted to absolute `M`, `L`, `C` and `Z` (section 5). Cached by string.
Path parsePathData(String d) => _pathCache[d] ??= _parse(d);

final RegExp _token = RegExp(
  r'[MLCZ]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?',
);

Path _parse(String d) {
  final path = Path();
  final toks = _token.allMatches(d).map((m) => m[0]!).toList();
  var i = 0;
  var cmd = '';
  double num() => double.parse(toks[i++]);
  while (i < toks.length) {
    final t = toks[i];
    if (t == 'M' || t == 'L' || t == 'C' || t == 'Z') {
      cmd = t;
      i++;
      if (cmd == 'Z') {
        path.close();
        continue;
      }
    }
    switch (cmd) {
      case 'M':
        path.moveTo(num(), num());
        cmd = 'L'; // extra pairs after M are line-tos, as in SVG
      case 'L':
        path.lineTo(num(), num());
      case 'C':
        path.cubicTo(num(), num(), num(), num(), num(), num());
      default:
        throw FormatException('mascot: unsupported path data "$d"');
    }
  }
  return path;
}

// ---------------- the character (section 4) ----------------

/// `M7 0 H40 A24 24 0 0 1 64 24 V47 A7 7 0 0 1 57 54 H24 A24 24 0 0 1 0 30 V7 A7 7 0 0 1 7 0 Z`
final Path _tile = Path()
  ..moveTo(7, 0)
  ..lineTo(40, 0)
  ..arcToPoint(const Offset(64, 24), radius: const Radius.circular(24))
  ..lineTo(64, 47)
  ..arcToPoint(const Offset(57, 54), radius: const Radius.circular(7))
  ..lineTo(24, 54)
  ..arcToPoint(const Offset(0, 30), radius: const Radius.circular(24))
  ..lineTo(0, 7)
  ..arcToPoint(const Offset(7, 0), radius: const Radius.circular(7))
  ..close();

/// `M7 0 H38 L64 26 V47 A7 7 0 0 1 57 54 H24 A24 24 0 0 1 0 30 V7 A7 7 0 0 1 7 0 Z`
final Path _fold = Path()
  ..moveTo(7, 0)
  ..lineTo(38, 0)
  ..lineTo(64, 26)
  ..lineTo(64, 47)
  ..arcToPoint(const Offset(57, 54), radius: const Radius.circular(7))
  ..lineTo(24, 54)
  ..arcToPoint(const Offset(0, 30), radius: const Radius.circular(24))
  ..lineTo(0, 7)
  ..arcToPoint(const Offset(7, 0), radius: const Radius.circular(7))
  ..close();

/// `M38 0 L64 26 H62 A24 24 0 0 0 38 2 Z`
final Path _foldCorner = Path()
  ..moveTo(38, 0)
  ..lineTo(64, 26)
  ..lineTo(62, 26)
  ..arcToPoint(
    const Offset(38, 2),
    radius: const Radius.circular(24),
    clockwise: false,
  )
  ..close();

Paint _fill(Color color) => Paint()
  ..color = color
  ..isAntiAlias = true;

Paint _stroke(Color color, double width) => Paint()
  ..color = color
  ..isAntiAlias = true
  ..style = PaintingStyle.stroke
  ..strokeWidth = width
  ..strokeCap = StrokeCap.round
  ..strokeJoin = StrokeJoin.round;

void _actor(
  Canvas canvas,
  MascotColors c,
  MascotActor a,
  MascotPose p,
  MascotStates sp,
) {
  final s = a.s;
  final shadow = c['shadow'];
  if (a.shadow && shadow != null) {
    final lift = math.max(0, -p['y']);
    final k = p.values['shadow'] ?? 1;
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(a.cx + p['x'] * s, sp.ground + 6.5 * s),
        width: 2 * (27 * s * p['sx'] * k / (1 + lift / 30)),
        height: 2 * (3.4 * s * k),
      ),
      _fill(shadow),
    );
  }
  canvas
    ..save()
    ..translate(a.cx - 32 * s + p['x'] * s, a.by - 54 * s + p['y'] * s)
    ..scale(s, s)
    ..translate(32, 27)
    ..rotate(_rad(p['tilt']))
    ..translate(-32, -27)
    ..translate(32, 54)
    ..scale(p['sx'], p['sy'])
    ..translate(-32, -54);
  paintCharacter(canvas, c, p);
  canvas.restore();
}

/// Draws one Buddy in body units (tile 64 by 54 at the origin), section 4.3 order.
void paintCharacter(Canvas canvas, MascotColors c, MascotPose p) {
  final body = c['body']!;
  final feet = c['feet']!;
  final arm = c['arm']!;
  final ink = c['navy']!;
  _foot(canvas, p, true, feet);
  _foot(canvas, p, false, feet);
  _arm(canvas, p, true, arm);
  _arm(canvas, p, false, arm);
  if (p['fold'] >= 0.5) {
    canvas
      ..drawPath(_fold, _fill(body))
      ..drawPath(_foldCorner, _fill(ink));
  } else {
    canvas.drawPath(_tile, _fill(body));
  }
  const ex = 13.0, ey = 25.0;
  final edx = p['edx'], edy = p['edy'], blink = p['blink'];
  _crossfade(
    canvas,
    p.track('eyeL'),
    Rect.fromCenter(
      center: Offset(32 - ex + edx, ey + edy),
      width: 30,
      height: 30,
    ),
    (t) => _eye(canvas, t, 32 - ex + edx, ey + edy, blink, ink),
  );
  _crossfade(
    canvas,
    p.track('eyeR'),
    Rect.fromCenter(
      center: Offset(32 + ex + edx, ey + edy),
      width: 30,
      height: 30,
    ),
    (t) => _eye(canvas, t, 32 + ex + edx, ey + edy, blink, ink),
  );
  final mx = 32 + p['mdx'], my = 38 + p['mdy'], mw = p['mw'];
  _crossfade(
    canvas,
    p.track('mouth'),
    Rect.fromCenter(center: Offset(mx, my), width: mw + 16, height: mw + 16),
    (t) => _mouth(canvas, t, mx, my, mw, ink),
  );
  if (p['badge'] >= 0.5) {
    canvas.drawRRect(
      RRect.fromRectXY(const Rect.fromLTWH(25, -3, 14, 9), 3.5, 3.5),
      _fill(ink),
    );
  }
}

/// Section 4.9. Opacity applies to the shape as a whole, through a layer.
void _crossfade(
  Canvas canvas,
  (String, String?, double) track,
  Rect bounds,
  void Function(String type) draw,
) {
  final (cur, prev, fade) = track;
  if (prev == null || fade >= 1) return draw(cur);
  if (fade <= 0) return draw(prev);
  _withOpacity(canvas, bounds, 1 - fade, () => draw(prev));
  _withOpacity(canvas, bounds, fade, () => draw(cur));
}

void _withOpacity(Canvas canvas, Rect bounds, double o, void Function() draw) {
  canvas.saveLayer(bounds, Paint()..color = Color.fromRGBO(0, 0, 0, o));
  draw();
  canvas.restore();
}

void _foot(Canvas canvas, MascotPose p, bool left, Color fill) {
  final lift = left ? p['footL'] : p['footR'];
  final rot = left ? p['footLRot'] : p['footRRot'];
  final x = left ? 13.0 : 40.0;
  final px = left ? 18.5 : 45.5;
  final rr = RRect.fromRectXY(Rect.fromLTWH(x, 48 - lift, 11, 13), 5.5, 5.5);
  if (rot != 0) {
    canvas
      ..save()
      ..translate(px, 50 - lift)
      ..rotate(_rad(rot))
      ..translate(-px, -(50 - lift))
      ..drawRRect(rr, _fill(fill))
      ..restore();
  } else {
    canvas.drawRRect(rr, _fill(fill));
  }
}

void _arm(Canvas canvas, MascotPose p, bool left, Color fill) {
  final a = left ? p['aL'] : p['aR'];
  if (!(a > 0.02)) return;
  final ax = left ? p['aLx'] : p['aRx'];
  final ay = left ? p['aLy'] : p['aRy'];
  final ang = left ? p['aLang'] : p['aRang'];
  final len = (left ? p['aLlen'] : p['aRlen']) * a;
  final thumb = (left ? p['aLthumb'] : p['aRthumb']) >= 0.5;
  final rr = RRect.fromRectXY(
    Rect.fromLTWH(ax - 4.5, ay - len, 9, len + 4.5),
    4.5,
    math.min(4.5, (len + 4.5) / 2),
  );
  canvas
    ..save()
    ..translate(ax, ay)
    ..rotate(_rad(ang))
    ..translate(-ax, -ay)
    ..drawRRect(rr, _fill(fill))
    ..restore();
  if (thumb) {
    final q = _rad(ang);
    final tx = ax + len * math.sin(q), ty = ay - len * math.cos(q);
    canvas.drawRRect(
      RRect.fromRectXY(Rect.fromLTWH(tx - 4.5, ty - 14, 9, 14), 4.5, 4.5),
      _fill(fill),
    );
  }
}

/// Section 4.7.
void _eye(Canvas canvas, String type, double x, double y, double b, Color ink) {
  void oval(double cx, double cy, double rx, double ry) => canvas.drawOval(
    Rect.fromCenter(center: Offset(cx, cy), width: rx * 2, height: ry * 2),
    _fill(ink),
  );
  switch (type) {
    case 'oval':
      oval(x, y, 5.2, math.max(1.9, 7 * b));
    case 'big':
      oval(x, y - 1, 5.82, math.max(1.9, 8.54 * b));
    case 'small':
      oval(x, y, 3.4, math.max(1.9, 4.6 * b));
    case 'lid' || 'slantL' || 'slantR':
      final y0 = y - 0.7;
      final rot = type == 'slantL' ? 14.0 : (type == 'slantR' ? -14.0 : 0.0);
      final path = Path()
        ..moveTo(x - 5.2, y0)
        ..arcToPoint(
          Offset(x + 5.2, y0),
          radius: const Radius.elliptical(5.2, 7),
          clockwise: false,
        )
        ..close();
      if (rot != 0) {
        canvas
          ..save()
          ..translate(x, y)
          ..rotate(_rad(rot))
          ..translate(-x, -y)
          ..drawPath(path, _fill(ink))
          ..restore();
      } else {
        canvas.drawPath(path, _fill(ink));
      }
    case 'arc':
      canvas.drawPath(
        Path()
          ..moveTo(x - 5.5, y + 2.4)
          ..quadraticBezierTo(x, y - 5, x + 5.5, y + 2.4),
        _stroke(ink, 3.8),
      );
    case 'cup':
      canvas.drawPath(
        Path()
          ..moveTo(x - 5.5, y - 1.6)
          ..quadraticBezierTo(x, y + 4.6, x + 5.5, y - 1.6),
        _stroke(ink, 3.8),
      );
    case 'line':
      canvas.drawPath(
        Path()
          ..moveTo(x - 5.5, y + 1)
          ..lineTo(x + 5.5, y + 1),
        _stroke(ink, 3.8),
      );
    case 'x':
      canvas.drawPath(
        Path()
          ..moveTo(x - 4.5, y - 4.5)
          ..lineTo(x + 4.5, y + 4.5)
          ..moveTo(x + 4.5, y - 4.5)
          ..lineTo(x - 4.5, y + 4.5),
        _stroke(ink, 3.6),
      );
  }
}

/// Section 4.8.
void _mouth(
  Canvas canvas,
  String type,
  double x,
  double y,
  double w,
  Color ink,
) {
  final h = w / 2;
  void quad(double y0, double qx, double qy, double y1, double width) =>
      canvas.drawPath(
        Path()
          ..moveTo(x - h, y0)
          ..quadraticBezierTo(qx, qy, x + h, y1),
        _stroke(ink, width),
      );
  switch (type) {
    case 'line':
      canvas.drawPath(
        Path()
          ..moveTo(x - h, y)
          ..lineTo(x + h, y),
        _stroke(ink, 3.4),
      );
    case 'curve':
      quad(y - 1, x, y + 3.2, y - 1, 3.4);
    case 'big':
      quad(y - 1.6, x, y + 4.6, y - 1.6, 3.4);
    case 'soft':
      quad(y + 1, x, y - 1.6, y + 1, 3.2);
    case 'frown':
      quad(y + 1, x, y - 2.6, y + 1, 3.4);
    case 'o':
      canvas.drawCircle(
        Offset(x, y + 0.6),
        2.8,
        Paint()
          ..color = ink
          ..isAntiAlias = true
          ..style = PaintingStyle.stroke
          ..strokeWidth = 3,
      );
    case 'smirk':
      quad(y, x + w / 4, y + 2.4, y - 2, 3.2);
    case 'D':
      canvas.drawPath(
        Path()
          ..moveTo(x - h, y - 2)
          ..lineTo(x + h, y - 2)
          ..arcToPoint(Offset(x - h, y - 2), radius: Radius.circular(h))
          ..close(),
        _fill(ink),
      );
    case 'wavy':
      final x0 = x - h;
      canvas.drawPath(
        Path()
          ..moveTo(x0, y)
          ..quadraticBezierTo(x0 + w / 6, y - 2.4, x0 + w / 3, y)
          ..quadraticBezierTo(x, y + 2.4, x0 + 2 * w / 3, y)
          ..quadraticBezierTo(x + w / 3, y - 2.4, x + h, y),
        _stroke(ink, 3),
      );
  }
}

/// A [CustomPainter] for one frame. [frameOf] is read at paint time, so a player can repaint
/// through [repaint] without rebuilding widgets.
class MascotPainter extends CustomPainter {
  MascotPainter({
    required this.frameOf,
    this.surface = MascotSurface.light,
    this.background,
    super.repaint,
  });

  /// A fixed frame.
  MascotPainter.frame(
    MascotFrame frame, {
    MascotSurface surface = MascotSurface.light,
    Object? background,
  }) : this(frameOf: () => frame, surface: surface, background: background);

  final MascotFrame Function() frameOf;
  final MascotSurface surface;

  /// A palette token or a [Color] behind the scene; null for transparent.
  final Object? background;

  @override
  void paint(Canvas canvas, Size size) => paintMascotFrame(
    canvas,
    size,
    frameOf(),
    surface: surface,
    background: background,
  );

  @override
  bool shouldRepaint(MascotPainter old) =>
      old.surface != surface ||
      old.background != background ||
      !identical(old.frameOf, frameOf);
}

/// Renders [frame] to an opaque or transparent image of [px] by [px] pixels (for tests and
/// snapshots).
Future<ui.Image> renderMascotImage(
  MascotFrame frame,
  int px, {
  MascotSurface surface = MascotSurface.light,
  Object? background,
}) {
  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder);
  paintMascotFrame(
    canvas,
    Size(px.toDouble(), px.toDouble()),
    frame,
    surface: surface,
    background: background,
  );
  final picture = recorder.endRecording();
  return picture.toImage(px, px).whenComplete(picture.dispose);
}
