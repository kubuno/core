import { type ReactNode } from 'react';
/** Preview interactions are inert: every callback resolves to a no-op. */
export declare const noop: () => void;
export declare function PreviewStage({ title, width, height, children }: {
    title: string;
    width?: number;
    height?: number;
    children: ReactNode;
}): import("react").JSX.Element;
export declare function AnchoredDemo(): import("react").JSX.Element;
export declare function ResizeHandleDemo(): import("react").JSX.Element;
export declare function StartPageDemo(): import("react").JSX.Element;
