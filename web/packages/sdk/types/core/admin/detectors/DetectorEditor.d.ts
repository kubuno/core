/**
 * Code-behind of `DetectorEditor.kbview` (converted from `DetectorEditor.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs, type ValueChangedEventArgs } from '@kubuno/views';
import { type ComboboxOption } from "@ui";
import { type ChecksumAlgo, type Detector, type DetectorInput, type DetectorKind, type DetectorLimits } from "./api";
import { ViewBase } from './DetectorEditor.kbview';
import * as __parts from './DetectorEditor.parts';
interface Props {
    /** `null` creates a new detector. */
    id: string | null;
    limits?: DetectorLimits;
    onClose: () => void;
}
interface Form {
    key: string;
    label: string;
    description: string;
    category: string;
    kind: DetectorKind;
    pattern: string;
    terms: string;
    checksum: ChecksumAlgo | '';
    proximity_terms: string;
    proximity_window: number;
    proximity_required: boolean;
    base_confidence: number;
    checksum_bonus: number;
    proximity_bonus: number;
    min_confidence: number;
    min_matches: number;
    min_unique_matches: number;
    is_enabled: boolean;
}
export type { Props };
export declare class DetectorEditor extends ViewBase {
    accessor error: string | null;
    accessor saved: boolean;
    tr: DetectorEditorStores['t'];
    can: DetectorEditorStores['can'];
    data: DetectorEditorHooks['data'];
    isLoading: boolean;
    create: DetectorEditorStores['create'];
    update: DetectorEditorStores['update'];
    form: Form;
    setForm: DetectorEditorStores['setForm'];
    draftError: string | null;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../../authz/types").CanFn;
        create: import("@tanstack/react-query").UseMutationResult<unknown, Error, DetectorInput, unknown>;
        update: import("@tanstack/react-query").UseMutationResult<unknown, Error, {
            id: string;
            input: DetectorInput;
        }, unknown>;
        form: Form;
        setForm: import("react").Dispatch<import("react").SetStateAction<Form>>;
        draftError: string | null;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<{
            detector: Detector;
            used_by: string[];
        }> | undefined;
        isLoading: boolean;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canManage(): boolean;
    get detector(): Detector | undefined;
    get usedBy(): string[];
    get kindOptions(): ComboboxOption[];
    get checksumOptions(): ComboboxOption[];
    get categoryOptions(): ComboboxOption[];
    get busy(): boolean;
    get show_id(): boolean;
    get h1_text(): string;
    get show_is_loading_id(): boolean;
    get show_error(): boolean;
    get show_detector_is_builtin(): boolean;
    get show_used_by(): boolean;
    get callout_text(): string;
    get enabled_unless_can_manage(): boolean;
    get enabled_unless_can_manage_detector_is(): boolean;
    get show_form_kind_wordlist(): boolean;
    get show_not_form_kind_wordlist(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<label htmlFor>: attribute(s) without a .kbview property). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        form: Form;
        canManage: boolean;
        setForm: import("react").Dispatch<import("react").SetStateAction<Form>>;
    };
    /** A part of the screen still written in React (<textarea> has no .kbview element yet). */
    get Part2(): typeof __parts.Part2;
    get det_field_terms_hint_max(): number;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<label htmlFor>: attribute(s) without a .kbview property). */
    get Part3(): typeof __parts.Part3;
    get part4_props(): {
        form: Form;
        canManage: boolean;
        setForm: import("react").Dispatch<import("react").SetStateAction<Form>>;
    };
    /** A part of the screen still written in React (<textarea> has no .kbview element yet). */
    get Part4(): typeof __parts.Part4;
    get det_field_pattern_hint_max(): number;
    get show_form_kind_checksum(): boolean;
    get enabled_unless_can_manage2(): boolean;
    get part5_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<label htmlFor>: attribute(s) without a .kbview property). */
    get Part5(): typeof __parts.Part5;
    get part6_props(): {
        form: Form;
        canManage: boolean;
        setForm: import("react").Dispatch<import("react").SetStateAction<Form>>;
    };
    /** A part of the screen still written in React (<textarea> has no .kbview element yet). */
    get Part6(): typeof __parts.Part6;
    get part7_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        form: Form;
        canManage: boolean;
        setForm: import("react").Dispatch<import("react").SetStateAction<Form>>;
    };
    /** A part of the screen still written in React (<TextField> min, max: no .kbview property). */
    get Part7(): typeof __parts.Part7;
    /** A part of the screen still written in React (<TextField> min, max, step: no .kbview property). */
    get Part8(): typeof __parts.Part8;
    /** A part of the screen still written in React (<TextField> min, max, step: no .kbview property). */
    get Part9(): typeof __parts.Part9;
    /** A part of the screen still written in React (<TextField> min, max, step: no .kbview property). */
    get Part10(): typeof __parts.Part10;
    /** A part of the screen still written in React (<TextField> min, max, step: no .kbview property). */
    get Part11(): typeof __parts.Part11;
    /** A part of the screen still written in React (<TextField> min, max: no .kbview property). */
    get Part12(): typeof __parts.Part12;
    /** A part of the screen still written in React (<TextField> min, max: no .kbview property). */
    get Part13(): typeof __parts.Part13;
    /** `<DetectorTrial>`, rendered by a ReactHost. */
    get DetectorTrial(): import("react").FunctionComponent<Readonly<import("./DetectorTrial").Props>>;
    get detector_trial_props(): {
        detectorId: string | null;
        draft: DetectorInput | null;
        draftError: string | null;
    };
    get enabled_unless_busy(): boolean;
    save(): Promise<void>;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    text_field_text_changed(_sender: unknown, args: EventArgs): void;
    text_field_text_changed2(_sender: unknown, args: EventArgs): void;
    text_field_text_changed3(_sender: unknown, args: EventArgs): void;
    combo_box_selected_value_changed(_sender: unknown, args: ValueChangedEventArgs): void;
    switch_checked_changed(_sender: unknown, args: EventArgs): void;
    combo_box_selected_value_changed2(_sender: unknown, args: ValueChangedEventArgs): void;
    combo_box_selected_value_changed3(_sender: unknown, args: ValueChangedEventArgs): undefined;
    switch_checked_changed2(_sender: unknown, args: EventArgs): void;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click3(_sender: unknown, _args: MouseEventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type DetectorEditorStores = ReturnType<DetectorEditor['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type DetectorEditorHooks = ReturnType<DetectorEditor['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<Props>>;
export default _default;
