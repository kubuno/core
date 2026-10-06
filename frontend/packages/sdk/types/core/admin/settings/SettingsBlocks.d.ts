/**
 * Code-behind of `SettingsBlocks.kbview` (converted from `SettingsBlocks.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import type { ReactNode } from "react";
import type { SettingItem } from "./moduleSettingSchema";
import { ViewBase } from './SettingsBlocks.kbview';
export type SettingRowsProps = {
    basic: SettingItem[];
    advanced: SettingItem[];
    advancedOpen: boolean;
    onToggleAdvanced: () => void;
    renderRow: (item: SettingItem) => ReactNode;
};
export declare class SettingsBlocks extends ViewBase {
    tr: SettingsBlocksStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_basic_map_render_row(): {
        children: ReactNode[];
    };
    get show_advanced(): boolean;
    get show_not_advanced_open(): boolean;
    get text(): string;
    get content_advanced_open_advanced_map(): {
        children: false | ReactNode[];
    };
    panel_click(_sender: unknown, _args: MouseEventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type SettingsBlocksStores = ReturnType<SettingsBlocks['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<SettingRowsProps>>;
export default _default;
