// A server component using the static entry: no 'use client', no hooks.
import { BuddyStatic, renderRestSvg, restSvgDataUri, STATE_KEYS, STATE_INFO, type BuddyStaticProps, type StateInfo } from '@onstage/mascot/static';
import { renderRestSvg as pureSvg } from '@onstage/mascot/static-svg';

export function EmptyEventsStatic() {
  const props: BuddyStaticProps = { state: 'no-events', size: 160, surface: 'light', title: 'No events yet' };
  const first: StateInfo = STATE_INFO[0];
  return (
    <section>
      <BuddyStatic {...props} />
      <BuddyStatic state="invite-sent" surface="dark" decorative />
      <img alt="" src={restSvgDataUri('hello', { size: 64 })} />
      <div dangerouslySetInnerHTML={{ __html: renderRestSvg('hello', { surface: 'dark', size: 64 }) + pureSvg('hello') }} />
      <p>{STATE_KEYS.length} states, first is {first.name}</p>
    </section>
  );
}
