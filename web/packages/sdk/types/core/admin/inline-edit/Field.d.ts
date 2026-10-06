/**
 * Code-behind of `Field.kbview` (converted from `Field.tsx` by @kubuno/views-migrate).
 */
import type { ReactNode } from "react";
import { ViewBase } from './Field.kbview';
import * as __parts from './Field.parts';
export declare function orDash(value: ReactNode | null | undefined): ReactNode;
export type FieldProps = {
    label: ReactNode;
    children: ReactNode;
};
export declare class Field extends ViewBase {
    get part1_props(): {
        label: ReactNode;
    };
    /** A part of the screen still written in React (<dt> has no .kbview element yet). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        children: ReactNode;
    };
    /** A part of the screen still written in React (<dd> has no .kbview element yet). */
    get Part2(): typeof __parts.Part2;
}
declare const _default: import("react").FunctionComponent<Readonly<FieldProps>>;
export default _default;
