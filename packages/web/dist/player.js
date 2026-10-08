import { SPEC } from './spec-data.js';
import { getState, resolvePoses, sampleClip } from './pose.js';
import { drawScene } from './svg.js';
const MAX_DT = 0.1;
export function createPlayer(opts) {
    const rand = opts.random ?? Math.random;
    const B = SPEC.states.blink;
    const blinkClip = SPEC.motion[B.motion];
    const g = globalThis;
    const reqF = opts.requestFrame ?? (g.requestAnimationFrame ? g.requestAnimationFrame.bind(g) : undefined);
    const canF = opts.cancelFrame ?? (g.cancelAnimationFrame ? g.cancelAnimationFrame.bind(g) : undefined);
    const auto = (opts.autoStart ?? true) && !!reqF;
    let st = getState(opts.state);
    let surface = opts.surface ?? 'light';
    let reduced = !!opts.reducedMotion;
    let phase = 'rest';
    let t = 0;
    let end = 0;
    let blinkNext = [];
    let blinkStart = [];
    let current = '';
    let handle = null;
    let last = null;
    let userPaused = false;
    let hidden = false;
    let destroyed = false;
    const gap = () => B.gapMin + (B.gapMax - B.gapMin) * rand();
    const blinks = () => phase === 'idle' || (phase === 'motion' && st.motion.plays === 'loop');
    function initBlinks() {
        blinkStart = st.actors.map(() => -Infinity);
        blinkNext = st.actors.map(() => t + gap());
    }
    function blinkFactors() {
        if (!blinks() || !blinkClip)
            return undefined;
        return st.actors.map((_, i) => {
            while (t >= blinkNext[i]) {
                blinkStart[i] = blinkNext[i];
                blinkNext[i] = blinkStart[i] + (rand() < B.doubleChance ? B.doubleGap : gap());
            }
            const d = t - blinkStart[i];
            return d >= 0 && d <= blinkClip.duration ? sampleClip(blinkClip, d).blink : 1;
        });
    }
    function render() {
        const svg = drawScene(st, resolvePoses(st, phase, t, blinkFactors()), { surface, size: opts.size, background: opts.background, attrs: opts.attrs });
        if (svg === current)
            return;
        current = svg;
        if (opts.target)
            opts.target.innerHTML = svg;
        opts.onFrame?.(svg);
    }
    function enterIdle() { phase = 'idle'; t = 0; initBlinks(); }
    function start(play) {
        t = 0;
        last = null;
        if (reduced) {
            phase = 'rest';
            render();
            stopLoop();
            if (play && st.motion.plays === 'once' && opts.onDone)
                queueMicrotask(() => { if (!destroyed)
                    opts.onDone(); });
            return;
        }
        if (play) {
            phase = 'motion';
            const clip = SPEC.motion[st.motion.id];
            end = (clip ? clip.duration : 0) + Math.max(0, ...st.motion.actors.map(a => a.offset));
            if (st.motion.plays === 'loop')
                initBlinks();
        }
        else
            enterIdle();
        render();
        startLoop();
    }
    function tick(dt) {
        t += Math.min(Math.max(dt, 0), MAX_DT);
        if (phase === 'motion' && st.motion.plays === 'once' && t >= end) {
            if (st.motion.then === 'idle')
                enterIdle();
            else {
                phase = 'rest';
                t = 0;
            }
            opts.onDone?.();
        }
        render();
    }
    function frame(ms) {
        handle = null;
        if (destroyed || userPaused || hidden)
            return;
        const dt = last == null ? 0 : (ms - last) / 1000;
        last = ms;
        tick(dt);
        if (phase !== 'rest')
            handle = reqF(frame);
    }
    function startLoop() {
        if (!auto || handle != null || destroyed || userPaused || hidden || reduced || phase === 'rest')
            return;
        last = null;
        handle = reqF(frame);
    }
    function stopLoop() {
        if (handle != null && canF)
            canF(handle);
        handle = null;
        last = null;
    }
    const doc = g.document;
    const onVis = () => { hidden = !!doc?.hidden; if (hidden)
        stopLoop();
    else
        startLoop(); };
    if ((opts.pauseWhenHidden ?? true) && doc?.addEventListener) {
        hidden = !!doc.hidden;
        doc.addEventListener('visibilitychange', onVis);
    }
    start(opts.playOnMount ?? true);
    return {
        get stateKey() { return st.key; },
        get phase() { return phase; },
        get time() { return t; },
        play() { stopLoop(); start(true); },
        setState(key, o) { st = getState(key); stopLoop(); start(o?.play ?? true); },
        setSurface(s) { surface = s; current = ''; render(); },
        setReducedMotion(on) {
            if (on === reduced)
                return;
            reduced = on;
            stopLoop();
            if (on) {
                phase = 'rest';
                t = 0;
                render();
            }
            else
                start(false);
        },
        advance(dt) { if (!destroyed && !reduced)
            tick(dt); },
        pause() { userPaused = true; stopLoop(); },
        resume() { userPaused = false; startLoop(); },
        destroy() {
            destroyed = true;
            stopLoop();
            if (doc?.removeEventListener)
                doc.removeEventListener('visibilitychange', onVis);
        },
        svg: () => current,
    };
}
