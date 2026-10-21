'use client';
// The 0.3.0 additions as a consumer uses them: ambient clips, a ref handle and playClip.
import { useRef } from 'react';
import { Buddy, type BuddyHandle } from '@onstageapp/mascot/react';
import { createPlayer, renderFrameSvg, type AmbientOptions, type PlayClipOptions } from '@onstageapp/mascot';

export function Lively() {
  const buddy = useRef<BuddyHandle>(null);
  const ambient: AmbientOptions = { clips: ['hop', 'glance-left', 'glance-right'], gapMin: 6, gapMax: 10 };
  const o: PlayClipOptions = { then: 'idle', onDone: () => {} };
  const top = renderFrameSvg('excited', { phase: 'idle', t: 1, overlay: { clip: 'hop', t: 0.3 } });
  const make = (el: HTMLElement) => { const p = createPlayer({ state: 'excited', target: el, ambient }); p.playClip('look-around', o); return p.clip; };
  void make;
  return (
    <section>
      <Buddy ref={buddy} state="excited" ambient={ambient} />
      <button onClick={() => buddy.current?.playClip('hop')}>Hop</button>
      <div dangerouslySetInnerHTML={{ __html: top }} />
    </section>
  );
}
