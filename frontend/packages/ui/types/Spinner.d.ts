type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';
interface SpinnerProps {
    size?: SpinnerSize;
    className?: string;
    label?: string;
}
export declare function Spinner({ size, className, label }: SpinnerProps): import("react").JSX.Element;
export declare function SpinnerOverlay({ label }: {
    label?: string;
}): import("react").JSX.Element;
export {};
