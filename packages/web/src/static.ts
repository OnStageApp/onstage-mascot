// @onstageapp/mascot/static: the resting pose of every state and the props on their own, with no player,
// no timers and no motion data.
// For empty states, lists, emails, marketing, stickers, server-rendered pages and small bundles.
// Needs React only for BuddyStatic; use @onstageapp/mascot/static-svg for the string functions alone.
export type * from './types.js';
export { STATE_KEYS, STATE_INFO, PROP_KEYS, renderRestSvg, renderPropSvg, restSvgDataUri, type RestSvgOptions, type PropSvgOptions, type StateInfo } from './static-svg.js';
export { BuddyStatic, type BuddyStaticProps } from './buddy-static.js';
export { PropStatic, type PropStaticProps } from './prop-static.js';
