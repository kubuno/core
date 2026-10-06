/**
 * Code-behind of `HealthTopbarChip.kbview` (converted from `HealthTopbarChip.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { ViewBase } from './HealthTopbarChip.kbview';
import * as __parts from './HealthTopbarChip.parts';
export declare class HealthTopbarChip extends ViewBase {
    tr: HealthTopbarChipStores['t'];
    navigate: HealthTopbarChipStores['navigate'];
    pathname: string;
    user: HealthTopbarChipStores['user'];
    snoozedAt: HealthTopbarChipStores['snoozedAt'];
    data: HealthTopbarChipHooks['data'];
    onSnooze: () => void;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        navigate: import("react-router").NavigateFunction;
        pathname: string;
        user: import("../../types").User | null;
        snoozedAt: boolean;
        setSnoozedAt: import("react").Dispatch<import("react").SetStateAction<boolean>>;
        onSnooze: () => void;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<import("./types").HealthReport> | undefined;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get relevant(): boolean;
    get critical(): number;
    get warning(): number;
    get isCritical(): boolean;
    get Icon(): import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    get tone(): "border-danger" | "border-warning";
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_main(): boolean;
    get div_class(): string;
    get part1_props(): {
        Icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
        isCritical: boolean;
    };
    /** A part of the screen still written in React (<Icon> is no .kbview element (a local or dynamic component)). */
    get Part1(): typeof __parts.Part1;
    get span_text(): string;
    get show_is_critical(): boolean;
    get hc_banner_warning_body_days(): number;
    open(): void | Promise<void>;
    panel_click(_sender: unknown, _args: MouseEventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type HealthTopbarChipStores = ReturnType<HealthTopbarChip['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type HealthTopbarChipHooks = ReturnType<HealthTopbarChip['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
