// @onstageapp/mascot/static: the resting pose of every state, with no player, no timers and no motion data.
// For empty states, lists, emails, marketing, stickers, server-rendered pages and small bundles.
// Needs React only for BuddyStatic; use @onstageapp/mascot/static-svg for the string functions alone.
export type * from './types.js';
export { STATE_KEYS, STATE_INFO, renderRestSvg, restSvgDataUri, type RestSvgOptions, type StateInfo } from './static-svg.js';
export { BuddyStatic, type BuddyStaticProps } from './buddy-static.js';
