import type { PreviewStage } from './PreviewStage';
export declare function Part1({ setNode, width, height, node, children }: {
    setNode: NonNullable<PreviewStage['setNode']>;
    width: NonNullable<PreviewStage['width']>;
    height: NonNullable<PreviewStage['height']>;
    node: PreviewStage['node'];
    children: PreviewStage['props']['children'];
}): import("react").JSX.Element;
