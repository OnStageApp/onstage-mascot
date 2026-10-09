import { jsx as _jsx } from "react/jsx-runtime";
import { getStaticState, renderRestSvg } from './static-svg.js';
export function BuddyStatic({ state, surface = 'light', size = 160, title, decorative = false, className, style }) {
    const name = title ?? getStaticState(state).name;
    const hidden = decorative || !name;
    return (_jsx("span", { className: className, role: name ? 'img' : undefined, "aria-label": name || undefined, "aria-hidden": hidden ? true : undefined, style: { display: 'inline-block', width: size, height: size, lineHeight: 0, ...style }, dangerouslySetInnerHTML: { __html: renderRestSvg(state, { surface, size }) } }));
}
