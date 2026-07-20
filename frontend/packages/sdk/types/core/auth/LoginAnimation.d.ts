export type LoginAnimationPreset = 'A' | 'B' | 'C' | 'D';
export default function LoginAnimation({ preset, yShift }: {
    preset?: LoginAnimationPreset;
    yShift?: number;
}): import("react").JSX.Element;
