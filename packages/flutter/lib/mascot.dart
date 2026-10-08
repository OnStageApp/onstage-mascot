/// The OnStage mascot for Flutter: the `Buddy` widget, a pure frame function, a painter and a
/// headless player, all reading the bundled spec (generated from the repo's spec/).
/// See docs/renderer-contract.md and docs/flutter.md in the repo.
library;

export 'src/buddy.dart' show Buddy;
export 'src/painter.dart'
    show MascotPainter, paintMascotFrame, renderMascotImage;
export 'src/player.dart' show MascotPlayer;
export 'src/pose.dart'
    show MascotPhase, MascotFrame, MascotPose, computeFrame, resolvePoses;
export 'src/rng.dart' show mulberry32;
export 'src/spec.dart'
    show
        MascotSpec,
        MascotSurface,
        MascotColors,
        MascotStateDef,
        MascotActor,
        MascotClip,
        MotionRef;
