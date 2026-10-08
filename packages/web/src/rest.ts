// The resting pose of an actor as drawn: the stored rest pose with the crossfade state cleared.
// Kept apart from pose.ts (which reads the motion data) so the static entry can use it.
import type { Pose } from './types.js';

export function restPose(p: Pose): Pose {
  return { ...p, eyeLPrev: null, eyeLFade: 1, eyeRPrev: null, eyeRFade: 1, mouthPrev: null, mouthFade: 1 };
}
