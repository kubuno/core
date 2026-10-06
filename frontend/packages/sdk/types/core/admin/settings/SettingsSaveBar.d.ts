/**
 * Code-behind of `SettingsSaveBar.kbview` (converted from `SettingsSaveBar.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import type { ReactNode } from "react";
import { ViewBase } from './SettingsSaveBar.kbview';
export interface SettingsSaveBarProps {
    /** Staged changes belonging to THIS section. Zero disables the write. */
    count: number;
    /** Staged changes waiting in another section, tab or page. */
    elsewhere?: number;
    /** The way to reach them — a link, or a button that opens their section. */
    elsewhereAction?: ReactNode;
    /** Values the module's own declaration refuses. Blocks the write. */
    invalid?: number;
    /** True while this section's write is in flight. */
    saving?: boolean;
    /** Flashes on the action for a moment after a successful write. */
    saved?: boolean;
    /**
     * The staged changes would create the first local value on this scope, so the
     * primary action is "override the inherited value" rather than "save".
     *
     * Writing a value on a scope that has none yet does something different from
     * updating one it already holds: the first REMOVES the unit from its parent's
     * authority for that key, for good, and every unit below it with it. Naming
     * both "Enregistrer" hides that.
     */
    overriding?: boolean;
    onSave: () => void;
    onCancel: () => void;
}
export declare class SettingsSaveBar extends ViewBase {
    tr: SettingsSaveBarStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get elsewhere(): number;
    get invalid(): number;
    get saving(): boolean;
    get saved(): boolean;
    get overriding(): boolean;
    get blocked(): boolean;
    get disabled(): boolean;
    get show_blocked_elsewhere(): boolean;
    get span_class(): string;
    get show_not_blocked(): boolean;
    get text(): string;
    get text2(): string;
    get show_elsewhere_action(): boolean;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_elsewhere_action(): {
        children: string | number | bigint | true | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | import("react").ReactPortal | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined>;
    };
    get visible(): boolean;
    get button_class(): string;
    get button_class2(): string;
    get enabled_unless_disabled(): boolean;
    get text3(): string;
    panel_click(_sender: unknown, _args: MouseEventArgs): void;
    panel_click2(_sender: unknown, _args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type SettingsSaveBarStores = ReturnType<SettingsSaveBar['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<SettingsSaveBarProps>>;
export default _default;
