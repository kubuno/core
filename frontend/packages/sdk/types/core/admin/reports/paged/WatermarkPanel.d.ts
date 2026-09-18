import type { WatermarkSpec } from './watermark';
/**
 * The watermark's settings, anchored to the button that opens them.
 *
 * A popover rather than a modal: every control here changes the sheets behind
 * it, live. A dialog would cover the one thing the operator is adjusting.
 *
 * Three sliders and one choice, and no more. What a stamp is for — "BROUILLON",
 * a company mark, a case number — is settled by the text or the picture; the
 * rest is how loud it is and which way it leans.
 */
export default function WatermarkPanel({ value, onChange }: {
    value: WatermarkSpec;
    onChange: (next: WatermarkSpec) => void;
}): import("react").JSX.Element;
