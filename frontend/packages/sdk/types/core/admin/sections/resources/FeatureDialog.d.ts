/**
 * Code-behind of `FeatureDialog.kbview` (converted from `FeatureDialog.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import { type FeatureInput, type ResourceFeature } from "./api";
import { ViewBase } from './FeatureDialog.kbview';
import * as __parts from './FeatureDialog.parts';
export type FeatureDialogProps = {
    feature: ResourceFeature | null;
    onClose: () => void;
};
export declare class FeatureDialog extends ViewBase {
    accessor error: string | null;
    tr: FeatureDialogStores['t'];
    name: FeatureDialogHooks['name'];
    setName: FeatureDialogHooks['setName'];
    note: FeatureDialogHooks['note'];
    setNote: FeatureDialogHooks['setNote'];
    create: FeatureDialogStores['create'];
    update: FeatureDialogStores['update'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        create: import("@tanstack/react-query").UseMutationResult<unknown, Error, FeatureInput, unknown>;
        update: import("@tanstack/react-query").UseMutationResult<unknown, Error, {
            id: string;
            input: FeatureInput;
        }, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        name: string;
        setName: import("react").Dispatch<import("react").SetStateAction<string>>;
        note: string;
        setNote: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get busy(): boolean;
    get enabled_unless_busy(): boolean;
    get title(): string;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        name: string;
        setName: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    /** A part of the screen still written in React (<TextField> autoFocus: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        note: string;
        setNote: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    /** A part of the screen still written in React (<TextArea> rows: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    get show_feature_feature_resource(): boolean;
    get res_feature_rename_warning_count(): number;
    get show_error(): boolean;
    submit(): Promise<void>;
    panel_mouse_down(_sender: unknown, args: MouseEventArgs): void;
    floating_window_confirm(_sender: unknown, _args: EventArgs): void;
    floating_window_close(_sender: unknown, _args: EventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type FeatureDialogStores = ReturnType<FeatureDialog['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type FeatureDialogHooks = ReturnType<FeatureDialog['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<FeatureDialogProps>>;
export default _default;
