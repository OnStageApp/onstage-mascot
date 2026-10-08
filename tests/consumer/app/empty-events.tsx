'use client';
import { useState } from 'react';
import { Buddy, type BuddyProps } from '@onstage/mascot/react';
import { createPlayer, type Player } from '@onstage/mascot';

export function EmptyEvents() {
  const [done, setDone] = useState(false);
  const props: BuddyProps = { state: 'no-events', size: 160, surface: 'light', onDone: () => setDone(true) };
  const make = (el: HTMLElement): Player => createPlayer({ state: 'loading', target: el });
  void make;
  return (
    <section>
      <Buddy {...props} />
      <Buddy state="invite-sent" surface="dark" playOnMount={false} reducedMotion label="" />
      {done && <p>Create your first event</p>}
    </section>
  );
}
