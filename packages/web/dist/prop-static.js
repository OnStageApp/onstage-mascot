import { jsx as _jsx } from "react/jsx-runtime";
import { getProp, renderPropSvg } from './static-svg.js';
export function PropStatic({ prop, surface = 'light', size = 96, title, decorative = false, className, style }) {
    const name = title ?? getProp(prop).name;
    const hidden = decorative || !name;
    return (_jsx("span", { className: className, role: name && !hidden ? 'img' : undefined, "aria-label": name && !hidden ? name : undefined, "aria-hidden": hidden ? true : undefined, style: { display: 'inline-block', lineHeight: 0, ...style }, dangerouslySetInnerHTML: { __html: renderPropSvg(prop, { surface, size }) } }));
}
