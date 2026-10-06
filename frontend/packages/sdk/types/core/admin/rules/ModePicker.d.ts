/**
 * Code-behind of `ModePicker.kbview` (converted from `ModePicker.tsx` by @kubuno/views-migrate).
 */
import { type ValueChangedEventArgs } from '@kubuno/views';
import type { Mode } from "./types";
import { ViewBase } from './ModePicker.kbview';
import * as __parts from './ModePicker.parts';
interface Props {
    value: Mode;
    onChange: (mode: Mode) => void;
    /** Modes the catalogue says are settable. Anything else is not offered. */
    modes: Mode[];
    /** `enforce` needs at least one action — the server refuses it otherwise. */
    hasActions: boolean;
    disabled?: boolean;
}
export type { Props };
export declare class ModePicker extends ViewBase {
    tr: ModePickerStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get offered(): Mode[];
    /** A part of the screen still written in React (<Glyph> is no .kbview element (a local or dynamic component)). */
    get Part1(): typeof __parts.Part1;
    /** The rows of the Repeater over `offered`. */
    get rows_offered(): {
        mode: Mode;
        facts: import("./labels").ModeFacts;
        Glyph: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
        blocked: boolean;
        selected: boolean;
        label_class: string;
        enabled_unless_blocked_disabled: boolean;
        part1_props: {
            Glyph: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
        };
        span_text: string;
        variant: import("./labels").BadgeVariant;
        badge_text: string;
        p_text: string;
        li_text: string;
        li_text2: string;
        li_text3: string;
        li_text4: string;
        key: Mode;
    }[];
    radio_button_checked_changed(_sender: unknown, args: ValueChangedEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ModePickerStores = ReturnType<ModePicker['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<Props>>;
export default _default;
