export interface GradientStop {
    color: string;
    position: number;
    opacity: number;
}
export interface Gradient {
    type: 'linear' | 'radial';
    angle: number;
    stops: GradientStop[];
}
export declare function rgbaFromHex(hex: string, opacity?: number): string;
export declare function gradientToCss(g: Gradient): string;
export declare const DEFAULT_GRADIENT: Gradient;
