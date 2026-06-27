import React from 'react';
/** Renders `text` with every digit on an animated reel. Non-digits pass through. */
export declare function RollingNumber({ text, className }: {
    text: string;
    className?: string;
}): React.JSX.Element;
type Variant = 'bubble' | 'boxed';
type Orientation = 'horizontal' | 'vertical';
export interface RangeSliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    /** 'bubble' = thumb + rolling-counter tooltip; 'boxed' = editable number field. */
    variant?: Variant;
    /** Layout direction. 'vertical' only applies to the bubble variant (faders, EQ bands). */
    orientation?: Orientation;
    /** Format the displayed value (bubble tooltip / boxed field). */
    format?: (v: number) => string;
    /** Boxed variant: labels under the two ends (default = format(min)/format(max)). */
    minLabel?: React.ReactNode;
    maxLabel?: React.ReactNode;
    /** Bubble variant: always show the value tooltip (not only while dragging). */
    showValue?: boolean;
    /** Accent colour for the fill/thumb (defaults to the theme primary). */
    accent?: string;
    /** Track (unfilled) colour — set a light value for dark editor themes. */
    trackColor?: string;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    id?: string;
    'aria-label'?: string;
}
export declare function RangeSlider({ value, onChange, min, max, step, variant, orientation, format, minLabel, maxLabel, showValue, accent, trackColor, disabled, className, style, id, ...rest }: RangeSliderProps): React.JSX.Element;
export {};
