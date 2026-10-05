/**
 * Code-behind of `AppearanceDialog.kbview` (converted from `AppearanceDialog.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type AppearanceMode } from "../store/appearanceStore";
import { ViewBase } from './AppearanceDialog.kbview';
import * as __parts from './AppearanceDialog.parts';
export type AppearanceDialogProps = {
    moduleId: string;
    onClose: () => void;
};
export declare class AppearanceDialog extends ViewBase {
    tr: AppearanceDialogStores['t'];
    setPref: AppearanceDialogStores['setPref'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        setPref: (moduleId: string, patch: Partial<import("../store/appearanceStore").ModuleAppearance>) => void;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get current(): import("../store/appearanceStore").ModuleAppearance;
    get modes(): {
        id: AppearanceMode;
        label: string;
        variant: 'light' | 'dark' | 'system';
    }[];
    get schemeOptions(): {
        value: "modern" | "classic" | "high-contrast";
        label: string;
    }[];
    get densityOptions(): {
        value: "compact" | "responsive" | "comfortable";
        label: string;
    }[];
    /** `<ModeMock>`, rendered by a ReactHost. */
    get ModeMock(): typeof __parts.ModeMock;
    /** The rows of the Repeater over `modes`. */
    get rows_modes(): {
        m: {
            id: AppearanceMode;
            label: string;
            variant: "light" | "dark" | "system";
        };
        active: boolean;
        button_class: string;
        mode_mock_props: {
            variant: "dark" | "light" | "system";
        };
        span_class: string;
        key: AppearanceMode;
    }[];
    get part1_props(): {
        current: import("../store/appearanceStore").ModuleAppearance;
        setPref: (moduleId: string, patch: Partial<import("../store/appearanceStore").ModuleAppearance>) => void;
        moduleId: string;
        schemeOptions: {
            value: "modern" | "classic" | "high-contrast";
            label: string;
        }[];
    };
    /** A part of the screen still written in React (<Dropdown> width, height: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        current: import("../store/appearanceStore").ModuleAppearance;
        setPref: (moduleId: string, patch: Partial<import("../store/appearanceStore").ModuleAppearance>) => void;
        moduleId: string;
        densityOptions: {
            value: "compact" | "responsive" | "comfortable";
            label: string;
        }[];
    };
    /** A part of the screen still written in React (<Dropdown> width, height: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    stack_mouse_down(_sender: unknown, _args: MouseEventArgs): void;
    panel_mouse_down(_sender: unknown, args: MouseEventArgs): void;
    panel_click(_sender: unknown, args: MouseEventArgs): void;
    panel_click2(_sender: unknown, _args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AppearanceDialogStores = ReturnType<AppearanceDialog['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<AppearanceDialogProps>>;
export default _default;
