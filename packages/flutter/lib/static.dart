/// The static mascot for Flutter: `BuddyStatic`, the resting pose of a state with no Ticker, no
/// timers and no motion data. For empty states, lists, stickers and anywhere animation is unwanted
/// or heavy.
///
/// This library imports only the states data, never the player, the sampler or the baked clips.
/// For the animated mascot import `package:onstage_mascot/mascot.dart` instead (both can be used
/// together; they share `MascotSurface`).
/// See docs/renderer-contract.md and docs/flutter.md in the repo.
library;

export 'src/states.dart' show MascotSurface;
export 'src/static_buddy.dart'
    show BuddyStatic, MascotStateInfo, mascotStateInfo, mascotStateKeys;
