// A server component using the static entry: no 'use client', no hooks.
import { BuddyStatic, PropStatic, renderRestSvg, renderPropSvg, restSvgDataUri, PROP_KEYS, STATE_KEYS, STATE_INFO, type BuddyStaticProps, type MascotProp, type StateInfo } from '@onstageapp/mascot/static';
import { renderRestSvg as pureSvg } from '@onstageapp/mascot/static-svg';

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
      {PROP_KEYS.map((prop: MascotProp) => <PropStatic key={prop} prop={prop} size={64} surface="dark" decorative />)}
      <div dangerouslySetInnerHTML={{ __html: renderPropSvg('camera', { size: 48 }) }} />
    </section>
  );
}
