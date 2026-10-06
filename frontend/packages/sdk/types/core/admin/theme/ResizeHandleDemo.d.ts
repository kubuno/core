import { ViewBase } from './ResizeHandleDemo.kbview';
import * as __parts from './ResizeHandleDemo.parts';
export declare class ResizeHandleDemo extends ViewBase {
    accessor w: number;
    get part1_props(): {
        w: number;
    };
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part1(): typeof __parts.Part1;
    /** `<ResizeHandle>`, rendered by a ReactHost. */
    get ResizeHandle(): typeof import("../../../ui/ResizeHandle").ResizeHandle;
    get resize_handle_props(): {
        position: number;
        onResize: (value: ResizeHandleDemo["w"] | ((prev: ResizeHandleDemo["w"]) => ResizeHandleDemo["w"])) => void;
        min: number;
        max: number;
    };
    /** `setW` of the TSX: a value, or an update of the previous one. */
    setW(value: ResizeHandleDemo['w'] | ((prev: ResizeHandleDemo['w']) => ResizeHandleDemo['w'])): void;
}
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
