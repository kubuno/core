/**
 * Code-behind of `ActionsEditor.kbview` (converted from `ActionsEditor.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type MenuItem } from "@ui";
import type { ActionRow, ActionSpec } from "./types";
import { ViewBase } from './ActionsEditor.kbview';
import * as __parts from './ActionsEditor.parts';
interface Props {
    value: ActionSpec[];
    onChange: (next: ActionSpec[]) => void;
    catalogue: ActionRow[];
    maxActions: number;
    disabled?: boolean;
}
export type { Props };
export declare class ActionsEditor extends ViewBase {
    tr: ActionsEditorStores['t'];
    menu: ActionsEditorStores['menu'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        menu: {
            pos: import("@ui").MenuDropdownPos | null;
            open: (e: React.MouseEvent | React.MouseEvent<HTMLElement>) => void;
            openAt: (x: number, y: number) => void;
            close: () => void;
            isOpen: boolean;
        };
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get available(): ActionRow[];
    get full(): boolean;
    get addItems(): MenuItem[];
    get show_value(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Badge> with element children). */
    get Part1(): typeof __parts.Part1;
    /** A part of the screen still written in React (<Badge> with element children). */
    get Part2(): typeof __parts.Part2;
    get show_disabled(): boolean;
    /** A part of the screen still written in React (a list inside a list (nested Repeater)). */
    get Part3(): typeof __parts.Part3;
    /** The rows of the Repeater over `value`. */
    get rows_value(): {
        spec: ActionSpec;
        index: number;
        def: ActionRow | undefined;
        schema: import("./types").ParamDef[];
        span_text: string;
        badge_text: string;
        show_def_is_reversible: boolean;
        show_not_def_is_reversible: boolean;
        show_def_is_blocking: boolean;
        show_def_is_orphan: boolean;
        show_def_description: boolean;
        p_text: string | undefined;
        show_schema: boolean;
        part3_props: {
            schema: import("./types").ParamDef[];
            spec: ActionSpec;
            setParam: (index: number, name: string, v: unknown) => void;
            index: number;
            disabled: boolean | undefined;
        } | undefined;
        key: string;
    }[];
    get enabled_unless_full_available(): boolean;
    get show_menu_pos(): boolean;
    get part4_props(): {
        menu_pos: import("@ui").MenuDropdownPos;
        addItems: MenuItem[];
        menu: {
            pos: import("@ui").MenuDropdownPos | null;
            open: (e: React.MouseEvent | React.MouseEvent<HTMLElement>) => void;
            openAt: (x: number, y: number) => void;
            close: () => void;
            isOpen: boolean;
        };
    };
    /** A part of the screen still written in React (<ContextMenu> pos, onClose: no .kbview property). */
    get Part4(): typeof __parts.Part4;
    setParam(index: number, name: string, v: unknown): void;
    button_click(_sender: unknown, args: MouseEventArgs): undefined;
    button_click2(_sender: unknown, args: MouseEventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ActionsEditorStores = ReturnType<ActionsEditor['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<Props>>;
export default _default;
