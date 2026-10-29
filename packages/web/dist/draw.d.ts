import type { Pose, PropDef, StateDef, Surface, EyeType, MouthType, PaletteDoc } from './types.js';
/** What drawing needs from the spec: the palette, the canvas size and the ground line. */
export interface DrawSpec {
    palette: PaletteDoc;
    canvas: {
        width: number;
        height: number;
    };
    ground: number;
}
/** The part of a state that drawing reads (a StateDef without its motion reference also fits). */
export type DrawState = Pick<StateDef, 'actors' | 'layers'>;
/** Numbers in output: rounded to 3 decimals, no "-0". */
export declare function n(v: number): string;
type Colors = Record<string, string | null>;
export declare function eye(type: EyeType, x: number, y: number, blink: number, ink: string): string;
export declare function mouth(type: MouthType, x: number, y: number, w: number, ink: string): string;
export declare function character(c: Colors, p: Pose): string;
export interface DrawOptions {
    surface?: Surface;
    /** Width and height attributes in px (the viewBox is always the 240 by 240 canvas). Omit for none. */
    size?: number;
    /** A palette token or a CSS colour painted behind the scene. Omit for transparent. */
    background?: string;
    /** Extra attributes for the root <svg>, already escaped. */
    attrs?: string;
}
export declare function drawSceneWith(spec: DrawSpec, state: DrawState, poses: Pose[], opts?: DrawOptions): string;
/**
 * Draws a prop on its own (no Buddy, no ground shadow) in its box. Props differ in shape (a keyboard is
 * long, a microphone small), so `size` sets the area, not a side: the prop covers about size by size
 * px, and neither side exceeds 1.5 times size. Width and height follow the box's proportions.
 */
export declare function drawPropWith(spec: DrawSpec, prop: Pick<PropDef, 'box' | 'layers'>, opts?: Pick<DrawOptions, 'surface' | 'size'>): string;
export {};
