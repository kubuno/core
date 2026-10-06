/**
 * Code-behind of `CampaignWizard.kbview` (converted from `CampaignWizard.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs, type ValueChangedEventArgs } from '@kubuno/views';
import { type StepDef } from "@ui";
import type { User } from "../../../types";
import { type Campaign, type MigrationService, type SourceFolder } from "./api";
import { ViewBase } from './CampaignWizard.kbview';
import * as __parts from './CampaignWizard.parts';
interface Draft {
    key: string;
    login: string;
    password: string;
    targetId: string;
}
export type CampaignWizardProps = {
    services: MigrationService[];
    onClose: () => void;
    onCreated: (campaign: Campaign) => void;
};
export declare class CampaignWizard extends ViewBase {
    accessor step: string;
    accessor name: string;
    accessor host: string;
    accessor port: string;
    accessor security: string;
    accessor bulk: string;
    accessor drafts: Draft[];
    accessor since: string;
    accessor folders: SourceFolder[] | null;
    accessor excluded: string[];
    accessor startNow: boolean;
    accessor error: string | null;
    accessor probeMsg: string | null;
    tr: CampaignWizardStores['t'];
    service: CampaignWizardHooks['service'];
    setService: CampaignWizardHooks['setService'];
    probe: CampaignWizardStores['probe'];
    create: CampaignWizardStores['create'];
    userOptions: {
        value: string;
        label: string;
        description: string;
        keywords: string;
    }[];
    resolve: (raw: string) => string;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        probe: import("@tanstack/react-query").UseMutationResult<{
            ok: boolean;
            folders?: SourceFolder[];
            error?: string;
        }, Error, {
            service: string;
            source: {
                kind: string;
                host: string;
                port: number;
                security: string;
            };
            login: string;
            password: string;
        }, unknown>;
        create: import("@tanstack/react-query").UseMutationResult<Campaign, Error, import("./api").CampaignInput, unknown>;
        users: NoInfer<User[]> | undefined;
        userOptions: {
            value: string;
            label: string;
            description: string;
            keywords: string;
        }[];
        resolve: (raw: string) => string;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        service: string;
        setService: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get usable(): MigrationService[];
    get ready(): Draft[];
    get unresolved(): number;
    get steps(): StepDef[];
    get canLeaveService(): boolean;
    get canLeaveSource(): boolean;
    get canSubmit(): boolean;
    get last(): boolean;
    get order(): string[];
    get index(): number;
    get nextDisabled(): boolean;
    get confirm_text(): string;
    get enabled_unless_last_can_submit_next_disabled(): boolean;
    get confirm_busy(): boolean;
    get part1_props(): {
        steps: StepDef[];
        step: string;
        setStep: (value: CampaignWizard["step"] | ((prev: CampaignWizard["step"]) => CampaignWizard["step"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Stepper> steps: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_step_service(): boolean;
    /** A part of the screen still written in React (<input> has no .kbview element yet). */
    get Part2(): typeof __parts.Part2;
    /** The rows of the Repeater over `services`. */
    get rows_services(): {
        s: MigrationService;
        label_class: string | undefined;
        part2_props: {
            service: string;
            s: MigrationService;
            setService: import("react").Dispatch<import("react").SetStateAction<string>>;
        } | undefined;
        span_text: string | undefined;
        span_text2: string | undefined;
        key: string;
    }[];
    get show_usable(): boolean;
    get show_step_source(): boolean;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        name: string;
        setName: (value: CampaignWizard["name"] | ((prev: CampaignWizard["name"]) => CampaignWizard["name"])) => void;
    };
    /** A part of the screen still written in React (<TextField> autoFocus: no .kbview property). */
    get Part3(): typeof __parts.Part3;
    get part4_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        port: string;
        setPort: (value: CampaignWizard["port"] | ((prev: CampaignWizard["port"]) => CampaignWizard["port"])) => void;
    };
    /** A part of the screen still written in React (<TextField> inputMode: no .kbview property). */
    get Part4(): typeof __parts.Part4;
    get part5_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (a local or dynamic component)). */
    get Part5(): typeof __parts.Part5;
    get items_source(): {
        value: string;
        label: string;
    }[];
    get show_security_none(): boolean;
    get show_step_mapping(): boolean;
    get part6_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (a local or dynamic component)). */
    get Part6(): typeof __parts.Part6;
    get part7_props(): {
        bulk: string;
        setBulk: (value: CampaignWizard["bulk"] | ((prev: CampaignWizard["bulk"]) => CampaignWizard["bulk"])) => void;
    };
    /** A part of the screen still written in React (<textarea> has no .kbview element yet). */
    get Part7(): typeof __parts.Part7;
    get enabled_unless_bulk_trim(): boolean;
    get show_drafts(): boolean;
    get part8_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (a local or dynamic component)). */
    get Part8(): typeof __parts.Part8;
    /** The rows of the Repeater over `drafts`. */
    get rows_drafts(): {
        d: Draft;
        complete: boolean;
        selected_value: string | null | undefined;
        show_not_complete: boolean | undefined;
        key: string;
    }[];
    get variant(): "primary" | "neutral";
    get show_unresolved(): boolean;
    get text(): string;
    get show_step_range(): boolean;
    get part9_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        since: string;
        setSince: (value: CampaignWizard["since"] | ((prev: CampaignWizard["since"]) => CampaignWizard["since"])) => void;
    };
    /** A part of the screen still written in React (<TextField type="date">: no .kbview value). */
    get Part9(): typeof __parts.Part9;
    get enabled_unless_probe_is_pending(): boolean;
    get button_text(): string;
    get show_probe_msg(): boolean;
    get show_folders_folders(): boolean;
    get part10_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (a local or dynamic component)). */
    get Part10(): typeof __parts.Part10;
    /** The rows of the Repeater over `folders`. */
    get rows_folders(): {
        f: SourceFolder;
        off: boolean;
        button_class: string | undefined;
        text: string | undefined;
        key: string;
    }[];
    get show_folders(): boolean;
    get migr_summary_host(): string;
    get show_error(): boolean;
    get show_index(): boolean;
    applyBulk(): void;
    runProbe(): Promise<void>;
    submit(): Promise<void>;
    forward(): void;
    back(): void;
    panel_mouse_down(_sender: unknown, args: MouseEventArgs): void;
    floating_window_confirm(_sender: unknown, _args: EventArgs): void;
    floating_window_close(_sender: unknown, _args: EventArgs): void;
    combo_box_selected_value_changed(_sender: unknown, args: ValueChangedEventArgs): undefined;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    text_field_text_changed(_sender: unknown, args: EventArgs): undefined;
    text_field_text_changed2(_sender: unknown, args: EventArgs): undefined;
    combo_box_selected_value_changed2(_sender: unknown, args: ValueChangedEventArgs): undefined;
    panel_click(_sender: unknown, args: MouseEventArgs): undefined;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    panel_click2(_sender: unknown, args: MouseEventArgs): undefined;
    /** `setStep` of the TSX: a value, or an update of the previous one. */
    setStep(value: CampaignWizard['step'] | ((prev: CampaignWizard['step']) => CampaignWizard['step'])): void;
    /** `setName` of the TSX: a value, or an update of the previous one. */
    setName(value: CampaignWizard['name'] | ((prev: CampaignWizard['name']) => CampaignWizard['name'])): void;
    /** `setPort` of the TSX: a value, or an update of the previous one. */
    setPort(value: CampaignWizard['port'] | ((prev: CampaignWizard['port']) => CampaignWizard['port'])): void;
    /** `setBulk` of the TSX: a value, or an update of the previous one. */
    setBulk(value: CampaignWizard['bulk'] | ((prev: CampaignWizard['bulk']) => CampaignWizard['bulk'])): void;
    /** `setSince` of the TSX: a value, or an update of the previous one. */
    setSince(value: CampaignWizard['since'] | ((prev: CampaignWizard['since']) => CampaignWizard['since'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type CampaignWizardStores = ReturnType<CampaignWizard['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type CampaignWizardHooks = ReturnType<CampaignWizard['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<CampaignWizardProps>>;
export default _default;
