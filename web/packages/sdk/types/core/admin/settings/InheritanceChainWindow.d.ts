/**
 * Code-behind of `InheritanceChainWindow.kbview` (converted from `InheritanceChainWindow.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import type { ActiveScope, ChainResponse } from "./scopeTypes";
import { ViewBase } from './InheritanceChainWindow.kbview';
import * as __parts from './InheritanceChainWindow.parts';
export type InheritanceChainWindowProps = {
    settingKey: string;
    scope: ActiveScope;
    onClose: () => void;
    /**
     * The name the control above used. Passed in rather than taken from the
     * server response so the window and the row it was opened from say the same
     * thing — the catalogue translates a key the database only stores once.
     */
    title?: string;
};
export declare class InheritanceChainWindow extends ViewBase {
    tr: InheritanceChainWindowStores['t'];
    data: InheritanceChainWindowHooks['data'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<ChainResponse> | undefined;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get title(): string;
    /** A part of the screen still written in React (<li> with a computed style). */
    get Part1(): typeof __parts.Part1;
    /** The rows of the Repeater over `(data?.levels ?? [])`. */
    get rows_items(): {
        l: import("./scopeTypes").ChainLevel;
        i: number;
        part1_props: {
            l: import("./scopeTypes").ChainLevel;
            i: number;
            t: import("i18next").TFunction<"translation", undefined>;
        };
        key: string;
    }[];
    get show_data_overrides(): boolean;
    get chain_overrides_intro_count(): number;
    /** The rows of the Repeater over `data?.overrides`. */
    get rows_overrides(): {
        o: import("./scopeTypes").OverrideRef;
        span_text: string | undefined;
        key: string;
    }[] | undefined;
    floating_window_close(_sender: unknown, _args: EventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type InheritanceChainWindowStores = ReturnType<InheritanceChainWindow['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type InheritanceChainWindowHooks = ReturnType<InheritanceChainWindow['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<InheritanceChainWindowProps>>;
export default _default;
