import type { Pose, StateDef, Surface, EyeType, MouthType } from './types.js';
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
export declare function drawScene(state: StateDef, poses: Pose[], opts?: DrawOptions): string;
export {};
