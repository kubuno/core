import { type ReactNode } from "react";
import { ViewBase } from './PreviewStage.kbview';
import * as __parts from './PreviewStage.parts';
export type PreviewStageProps = {
    title: string;
    width?: number;
    height?: number;
    children: ReactNode;
};
export declare class PreviewStage extends ViewBase {
    accessor node: HTMLDivElement | null;
    get width(): number;
    get height(): number;
    get part1_props(): {
        setNode: (value: HTMLDivElement | null | ((prev: HTMLDivElement | null) => HTMLDivElement | null)) => void;
        width: number;
        height: number;
        node: HTMLDivElement | null;
        children: ReactNode;
    };
    /** A part of the screen still written in React (<div ref>: attribute(s) without a .kbview property). */
    get Part1(): typeof __parts.Part1;
    /** `setNode` of the TSX: a value, or an update of the previous one. */
    setNode(value: HTMLDivElement | null | ((prev: HTMLDivElement | null) => HTMLDivElement | null)): void;
}
declare const _default: import("react").FunctionComponent<Readonly<PreviewStageProps>>;
export default _default;
