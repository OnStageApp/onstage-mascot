// A server component page, as in a Next 16 App Router project.
import { renderFrameSvg, STATE_KEYS, type FrameInfo } from '@onstageapp/mascot';
import { EmptyEvents } from './empty-events';

export default function Page() {
  const frame: FrameInfo = { phase: 'rest' };
  const og = renderFrameSvg('hello', frame, { size: 64 });
  return (
    <main>
      <EmptyEvents />
      <div dangerouslySetInnerHTML={{ __html: og }} />
      <p>{STATE_KEYS.length} states</p>
    </main>
  );
}
