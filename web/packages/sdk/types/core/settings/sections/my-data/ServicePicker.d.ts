/**
 * Code-behind of `ServicePicker.kbview` (converted from `ServicePicker.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs, type ValueChangedEventArgs } from '@kubuno/views';
import type { MyExportService } from "./api";
import { ViewBase } from './ServicePicker.kbview';
import * as __parts from './ServicePicker.parts';
export interface ServicePickerProps {
    services: MyExportService[];
    /** Ids currently kept. Required services are always in it. */
    selected: Set<string>;
    onChange: (next: Set<string>) => void;
}
interface Group {
    moduleId: string;
    /** The label shown for the group: the module's single service, or its id. */
    label: string;
    items: MyExportService[];
}
export declare class ServicePicker extends ViewBase {
    tr: ServicePickerStores['t'];
    groups: Group[];
    unfolded: Set<string>;
    setUnfolded: ServicePickerStores['setUnfolded'];
    required: string[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        unfolded: Set<string>;
        setUnfolded: import("react").Dispatch<import("react").SetStateAction<Set<string>>>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        groups: Group[];
        required: string[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    /** A part of the screen still written in React (<button aria-expanded>: attribute(s) without a .kbview property). */
    get Part1(): typeof __parts.Part1;
    /** A part of the screen still written in React (a list inside a list (nested Repeater)). */
    get Part2(): typeof __parts.Part2;
    /** The rows of the Repeater over `groups`. */
    get rows_groups(): {
        group: Group;
        ids: string[];
        kept: string[];
        all: boolean;
        some: boolean;
        splittable: boolean;
        open: boolean;
        head: MyExportService;
        check_state: string;
        enabled_unless_group_items_every: boolean;
        p_text: string;
        show_splittable_head_description: boolean;
        p_text2: string | undefined;
        part1_props: {
            toggleFold: (moduleId: string) => void;
            group: Group;
            open: boolean;
            t: import("i18next").TFunction<"translation", undefined>;
        } | undefined;
        show_splittable_open: boolean;
        part2_props: {
            group: Group;
            selected: Set<string>;
            toggle: (ids: string[], keep: boolean) => void;
        } | undefined;
        key: string;
    }[];
    setAll(keepAll: boolean): void;
    toggle(ids: string[], keep: boolean): void;
    toggleFold(moduleId: string): void;
    button_click(_sender: unknown, _args: MouseEventArgs): void;
    button_click2(_sender: unknown, _args: MouseEventArgs): void;
    check_box_checked_changed(_sender: unknown, args: ValueChangedEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ServicePickerStores = ReturnType<ServicePicker['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ServicePickerHooks = ReturnType<ServicePicker['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<ServicePickerProps>>;
export default _default;
