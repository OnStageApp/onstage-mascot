'use client';
import { jsx as _jsx } from "react/jsx-runtime";
// The React component. Server render: the state's resting pose as inline SVG. In the browser it plays
// the state's motion once, then idles with random blinks; it pauses while the tab is hidden and
// respects prefers-reduced-motion unless `reducedMotion` is given.
import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { renderFrameSvg } from './render.js';
import { createPlayer } from './player.js';
import { getState } from './pose.js';
const QUERY = '(prefers-reduced-motion: reduce)';
function usePrefersReducedMotion() {
    // Read synchronously on the client so the first effect already knows; the server assumes false
    // (nothing in the markup depends on it, so hydration cannot mismatch).
    const [reduce, setReduce] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(QUERY).matches);
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia)
            return;
        const mq = window.matchMedia(QUERY);
        setReduce(mq.matches);
        const on = () => setReduce(mq.matches);
        mq.addEventListener?.('change', on);
        return () => mq.removeEventListener?.('change', on);
    }, []);
    return reduce;
}
export function Buddy({ state, surface = 'light', size = 160, playOnMount = true, onDone, reducedMotion, label, className, style, ambient, ref: handle }) {
    const ref = useRef(null);
    const player = useRef(null);
    const done = useRef(onDone);
    done.current = onDone;
    const ambientRef = useRef(ambient);
    ambientRef.current = ambient;
    // A new object with the same clips and gaps must not reschedule the ambient clips.
    const ambientKey = ambient && ambient.clips.length ? JSON.stringify([ambient.clips, ambient.gapMin, ambient.gapMax]) : '';
    useImperativeHandle(handle, () => ({
        play: () => player.current?.play(),
        playClip: (id, o) => player.current?.playClip(id, o),
    }), []);
    const prefers = usePrefersReducedMotion();
    const reduced = reducedMotion ?? prefers;
    // What the server renders and the first client paint shows: the resting pose (frame 0 of every motion).
    const initial = useMemo(() => renderFrameSvg(state, {}, { surface, size }), [state, surface, size]);
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        const p = createPlayer({ state, surface, size, target: el, playOnMount, reducedMotion: reduced, ambient: ambientRef.current, onDone: () => done.current?.() });
        player.current = p;
        return () => { p.destroy(); player.current = null; };
        // Surface and reduced motion are applied in place below; a new state or size restarts the player.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state, size, playOnMount]);
    useEffect(() => { player.current?.setSurface(surface); }, [surface]);
    useEffect(() => { player.current?.setReducedMotion(reduced); }, [reduced]);
    const ambientSeen = useRef(ambientKey);
    useEffect(() => {
        if (ambientSeen.current === ambientKey)
            return; // the player was created with it
        ambientSeen.current = ambientKey;
        player.current?.setAmbient(ambientRef.current ?? null);
    }, [ambientKey]);
    const name = label ?? getState(state).name;
    return (_jsx("span", { ref: ref, className: className, role: name ? 'img' : undefined, "aria-label": name || undefined, "aria-hidden": name ? undefined : true, style: { display: 'inline-block', width: size, height: size, lineHeight: 0, ...style }, dangerouslySetInnerHTML: { __html: initial } }));
}
