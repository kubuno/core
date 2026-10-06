/**
 * Code-behind of `MyDataTab.kbview` (converted from `MyDataTab.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type StepDef } from "@ui";
import { ViewBase } from './MyDataTab.kbview';
import * as __parts from './MyDataTab.parts';
export declare class MyDataTab extends ViewBase {
    accessor maxFileMb: number | null;
    tr: MyDataTabStores['t'];
    i18n: MyDataTabStores['i18n'];
    toast: MyDataTabStores['toast'];
    data: MyDataTabStores['data'];
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    request: MyDataTabStores['request'];
    selected: Set<string>;
    setSelected: MyDataTabStores['setSelected'];
    steps: StepDef[];
    stepper: MyDataTabStores['stepper'];
    landed: MyDataTabStores['landed'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        toast: import("@ui").ToastApi;
        data: NoInfer<import("./api").MyExportOverview> | undefined;
        isLoading: boolean;
        isError: boolean;
        error: Error | null;
        request: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, import("./api").RequestMyExportBody, unknown>;
        selected: Set<string>;
        setSelected: import("react").Dispatch<import("react").SetStateAction<Set<string>>>;
        steps: StepDef[];
        stepper: import("@ui").UseStepperResult;
        landed: import("react").RefObject<boolean>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {};
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get goTo(): (id: string) => void;
    get hasSomething(): boolean;
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get part1_props(): {
        error: Error | null;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Callout> icon: a value the property converts (null-when-false)). */
    get Part1(): typeof __parts.Part1;
    get show_main(): boolean;
    get part2_props(): {
        stepper: import("@ui").UseStepperResult;
        goTo: (id: string) => void;
        hasSomething: boolean;
        data: NoInfer<import("./api").MyExportOverview>;
        selected: Set<string>;
        setSelected: import("react").Dispatch<import("react").SetStateAction<Set<string>>>;
        maxFileMb: number | null;
        setMaxFileMb: (value: number | null | ((prev: number | null) => number | null)) => void;
        i18n: import("i18next").i18n;
        startOver: () => void;
    };
    /** A part of the screen still written in React (<Stepper> steps: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    get show_stepper_id_download(): boolean;
    get show_stepper_id_options(): boolean;
    get show_stepper_id_services(): boolean;
    get show_not_stepper_id_services(): boolean;
    get enabled_unless_data_active(): boolean;
    get show_data_active_stepper(): boolean;
    submit(): undefined;
    startOver(): void;
    button_click(_sender: unknown, _args: MouseEventArgs): void;
    button_click2(_sender: unknown, _args: MouseEventArgs): void;
    /** `setMaxFileMb` of the TSX: a value, or an update of the previous one. */
    setMaxFileMb(value: number | null | ((prev: number | null) => number | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type MyDataTabStores = ReturnType<MyDataTab['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type MyDataTabHooks = ReturnType<MyDataTab['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
