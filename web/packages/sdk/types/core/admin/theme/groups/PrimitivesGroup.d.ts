/**
 * Code-behind of `PrimitivesGroup.kbview` (converted from `PrimitivesGroup.tsx` by @kubuno/views-migrate).
 */
import { type ValueChangedEventArgs } from '@kubuno/views';
import { ViewBase } from './PrimitivesGroup.kbview';
import * as __parts from './PrimitivesGroup.parts';
export declare class PrimitivesGroup extends ViewBase {
    accessor chk: boolean;
    accessor tgl: boolean;
    accessor slide: number;
    accessor dt: string | null;
    tr: PrimitivesGroupStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    /** A part of the screen still written in React (<TextField LeftIcon>: an icon size the element cannot take). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        dt: string | null;
        setDt: (value: string | null | ((prev: string | null) => string | null)) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<DatePicker mode="datetime">: no .kbview value). */
    get Part2(): typeof __parts.Part2;
    radio_button_checked_changed(_sender: unknown, _args: ValueChangedEventArgs): void;
    /** `setDt` of the TSX: a value, or an update of the previous one. */
    setDt(value: string | null | ((prev: string | null) => string | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type PrimitivesGroupStores = ReturnType<PrimitivesGroup['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
