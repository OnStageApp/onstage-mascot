export function restPose(p) {
    return { ...p, eyeLPrev: null, eyeLFade: 1, eyeRPrev: null, eyeRFade: 1, mouthPrev: null, mouthFade: 1 };
}
