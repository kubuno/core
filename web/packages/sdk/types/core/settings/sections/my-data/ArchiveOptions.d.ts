import type { MyExportPolicy } from "./api";
import { ViewBase } from './ArchiveOptions.kbview';
import * as __parts from './ArchiveOptions.parts';
export interface ArchiveOptionsProps {
    policy: MyExportPolicy;
    format: string;
    maxFileMb: number;
    onMaxFileMb: (value: number) => void;
}
export declare class ArchiveOptions extends ViewBase {
    tr: ArchiveOptionsStores['t'];
    options: {
        value: string;
        label: string;
        description: string | undefined;
    }[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        options: {
            value: string;
            label: string;
            description: string | undefined;
        }[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get mde_opt_format_desc_format(): string;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<label htmlFor>: attribute(s) without a .kbview property). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        maxFileMb: number;
        onMaxFileMb: (value: number) => void;
        options: {
            value: string;
            label: string;
            description: string | undefined;
        }[];
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<ComboBox> id, width: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    get p_text(): string;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ArchiveOptionsStores = ReturnType<ArchiveOptions['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ArchiveOptionsHooks = ReturnType<ArchiveOptions['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<ArchiveOptionsProps>>;
export default _default;
