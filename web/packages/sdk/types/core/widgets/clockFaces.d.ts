type Ctx = CanvasRenderingContext2D;
export interface Palette {
    text: string;
    textSec: string;
    textTer: string;
    surface0: string;
    surface1: string;
    surface2: string;
    border: string;
    primary: string;
}
export interface FaceExtras {
    time?: string;
    hh?: string;
    mm?: string;
    ss?: string;
    ampm?: string;
    showSeconds?: boolean;
    digital?: string;
    day?: string;
    year?: string;
    month?: string;
    weekday?: string;
    theme?: Palette;
}
export type FaceDraw = (ctx: Ctx, W: number, H: number, date: Date, ex: FaceExtras) => void;
export declare function resolveTheme(): Palette;
export interface FaceDef {
    draw: FaceDraw;
    chrome: 'card' | 'bleed';
    bg?: string;
}
export declare const CLOCK_FACES: Record<string, FaceDef>;
export declare function FlipClockCanvas({ width, height, hh, mm, ss, showSeconds, ampm }: {
    width: number;
    height: number;
    hh: string;
    mm: string;
    ss: string;
    showSeconds: boolean;
    ampm?: string;
}): import("react").JSX.Element;
export declare function ClockCanvas({ draw, width, height, date, extras }: {
    draw: FaceDraw;
    width: number;
    height: number;
    date: Date;
    extras: FaceExtras;
}): import("react").JSX.Element;
export {};
