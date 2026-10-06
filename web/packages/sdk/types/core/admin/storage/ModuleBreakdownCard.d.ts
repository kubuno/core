import { type Segment } from "./charts";
import type { ModuleBreakdown, ModuleUsage } from "./api";
import { ViewBase } from './ModuleBreakdownCard.kbview';
import * as __parts from './ModuleBreakdownCard.parts';
export type ModuleBreakdownCardProps = {
    data: ModuleBreakdown;
};
export declare class ModuleBreakdownCard extends ViewBase {
    accessor open: string | null;
    tr: ModuleBreakdownCardStores['t'];
    series: readonly string[];
    rules: ModuleBreakdownCardHooks['rules'];
    reading: ModuleBreakdownCardHooks['reading'];
    declaring: (ModuleUsage & {
        used_bytes: number;
    })[];
    silent: ModuleUsage[];
    colorOf: (id: string) => string;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        series: readonly string[];
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        rules: import("./categories").CategoryRules;
        reading: import("./categories").CategoryReading;
        declaring: (ModuleUsage & {
            used_bytes: number;
        })[];
        silent: ModuleUsage[];
        colorOf: (id: string) => string;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get withBytes(): (ModuleUsage & {
        used_bytes: number;
    })[];
    get shown(): (ModuleUsage & {
        used_bytes: number;
    })[];
    get folded(): (ModuleUsage & {
        used_bytes: number;
    })[];
    get foldedBytes(): number;
    get total(): number;
    get segments(): Segment[];
    get nothingDeclared(): boolean;
    get show_not_nothing_declared(): boolean;
    /** `<CompositionBar>`, rendered by a ReactHost. */
    get CompositionBar(): import("react").FunctionComponent<Readonly<import("./CompositionBar").CompositionBarProps>>;
    get composition_bar_props(): {
        segments: Segment[];
        total: number;
        ariaLabel: string;
    };
    get show_declaring(): boolean;
    /** A part of the screen still written in React (<button aria-expanded>: attribute(s) without a .kbview property). */
    get Part1(): typeof __parts.Part1;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    /** `<CategoryRows>`, rendered by a ReactHost. */
    get CategoryRows(): import("react").FunctionComponent<Readonly<import("./CategoryRows").CategoryRowsProps>>;
    /** `<DelegatedNote>`, rendered by a ReactHost. */
    get DelegatedNote(): import("react").FunctionComponent<Readonly<import("./DelegatedNote").DelegatedNoteProps>>;
    /** The rows of the Repeater over `declaring`. */
    get rows_declaring(): {
        m: ModuleUsage & {
            used_bytes: number;
        };
        cats: import("./api").CategoryUsage[];
        expandable: boolean;
        isOpen: boolean;
        meta: string;
        identity: import("react").JSX.Element;
        show_not_expandable: boolean | undefined;
        part1_props: {
            isOpen: boolean;
            setOpen: (value: string | null | ((prev: string | null) => string | null)) => void;
            m: ModuleUsage & {
                used_bytes: number;
            };
            identity: import("react").JSX.Element;
        } | undefined;
        content_identity: {
            children: import("react").JSX.Element;
        } | undefined;
        span_text: string | undefined;
        category_rows_props: {
            rows: import("./api").CategoryUsage[];
            rules: import("./categories").CategoryRules;
        } | undefined;
        delegated_note_props: {
            bytes: number;
            objects: number;
            scope: string;
            className: string;
        } | undefined;
        key: string;
    }[];
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        data: ModuleBreakdown;
    };
    /** A part of the screen still written in React (<Figure> is no .kbview element (./Figure#default)). */
    get Part2(): typeof __parts.Part2;
    /** A part of the screen still written in React (<Figure> is no .kbview element (./Figure#default)). */
    get Part3(): typeof __parts.Part3;
    /** A part of the screen still written in React (<Figure> is no .kbview element (./Figure#default)). */
    get Part4(): typeof __parts.Part4;
    /** `<CategoryComposition>`, rendered by a ReactHost. */
    get CategoryComposition(): import("react").FunctionComponent<Readonly<import("./CategoryComposition").CategoryCompositionProps>>;
    get category_composition_props(): {
        reading: import("./categories").CategoryReading;
        heldBytes: number;
        ariaLabel: string;
        delegatedBytes: number;
        delegatedObjects: number;
    };
    get show_silent(): boolean;
    /** The rows of the Repeater over `silent`. */
    get rows_silent(): {
        m: ModuleUsage;
        key: string;
    }[];
    get show_data_over_declared(): boolean;
    get sto_mod_over_bytes(): string;
    /** `setOpen` of the TSX: a value, or an update of the previous one. */
    setOpen(value: string | null | ((prev: string | null) => string | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ModuleBreakdownCardStores = ReturnType<ModuleBreakdownCard['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ModuleBreakdownCardHooks = ReturnType<ModuleBreakdownCard['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<ModuleBreakdownCardProps>>;
export default _default;
