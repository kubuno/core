import { ViewBase } from './ComboboxDemo.kbview';
import * as __parts from './ComboboxDemo.parts';
export declare class ComboboxDemo extends ViewBase {
    accessor unit: string | null;
    accessor free: string | null;
    tr: ComboboxDemoStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        unit: string | null;
        setUnit: (value: string | null | ((prev: string | null) => string | null)) => void;
    };
    /** A part of the screen still written in React (<ComboBox> clearable, onClear: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get items_source(): {
        group: undefined;
        value: string;
        label: string;
        description?: string;
    }[];
    /** `setUnit` of the TSX: a value, or an update of the previous one. */
    setUnit(value: string | null | ((prev: string | null) => string | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ComboboxDemoStores = ReturnType<ComboboxDemo['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
