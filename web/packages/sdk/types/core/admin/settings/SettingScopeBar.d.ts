/**
 * Code-behind of `SettingScopeBar.kbview` (converted from `SettingScopeBar.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import type { OrgUnit } from "../../types";
import { type ActiveScope } from "./scopeTypes";
import { ViewBase } from './SettingScopeBar.kbview';
export type SettingScopeBarProps = {
    scope: ActiveScope;
    onChange: (next: ActiveScope) => void;
    /**
     * False when the bar heads a settings BLOCK inside a page that is about
     * something else: pinning it to the viewport there would park it over the
     * inventory the operator is scrolling through, far from what it qualifies.
     */
    sticky?: boolean;
};
export declare class SettingScopeBar extends ViewBase {
    accessor picking: boolean;
    tr: SettingScopeBarStores['t'];
    units: SettingScopeBarStores['units'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        units: NoInfer<OrgUnit[]> | undefined;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get sticky(): boolean;
    get path(): OrgUnit[];
    get isInstance(): boolean;
    get div_class(): string;
    get button_class(): string;
    /** The rows of the Repeater over `path`. */
    get rows_path(): {
        u: OrgUnit;
        i: number;
        button_class: string;
        key: string;
    }[];
    get p_text(): string;
    /** `<OrgUnitPicker>`, rendered by a ReactHost. */
    get OrgUnitPicker(): import("react").FunctionComponent<Readonly<import("../OrgUnitPicker").OrgUnitPickerProps>>;
    get org_unit_picker_props(): Readonly<import("../OrgUnitPicker").OrgUnitPickerProps>;
    panel_click(_sender: unknown, _args: MouseEventArgs): void;
    panel_click2(_sender: unknown, args: MouseEventArgs): void;
    panel_click3(_sender: unknown, _args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type SettingScopeBarStores = ReturnType<SettingScopeBar['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<SettingScopeBarProps>>;
export default _default;
