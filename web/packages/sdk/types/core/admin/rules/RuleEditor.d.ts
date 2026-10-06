/**
 * Code-behind of `RuleEditor.kbview` (converted from `RuleEditor.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type StepDef } from "@ui";
import { type UiGroup, type Verdict } from "./condition";
import { type LeafContext } from "./leafKinds";
import type { SummaryContext } from "./summary";
import { type RuleInput, type RuleLimits } from "./types";
import { ViewBase } from './RuleEditor.kbview';
import * as __parts from './RuleEditor.parts';
export type Pane = 'basics' | 'conditions' | 'actions' | 'scope' | 'mode' | 'impact' | 'history';
interface Props {
    /** `null` ⇒ creation. */
    ruleId: string | null;
    onClose: () => void;
    canWrite: boolean;
    /** Deep link into one pane (`/admin/rules?rule=…&pane=impact`). */
    initialPane?: Pane;
}
export type { Props };
export declare class RuleEditor extends ViewBase {
    accessor verdicts: Record<string, Verdict> | null;
    accessor loaded: boolean;
    accessor error: string | null;
    tr: RuleEditorStores['t'];
    i18n: RuleEditorStores['i18n'];
    toast: RuleEditorStores['toast'];
    isMobile: boolean;
    catalog: RuleEditorStores['catalog'];
    detail: RuleEditorHooks['detail'];
    create: RuleEditorStores['create'];
    update: RuleEditorStores['update'];
    dir: RuleEditorStores['dir'];
    pane: Pane;
    setPane: RuleEditorHooks['setPane'];
    input: RuleInput;
    setInput: RuleEditorStores['setInput'];
    tree: UiGroup;
    setTree: RuleEditorStores['setTree'];
    leafCtx: LeafContext;
    summaryCtx: SummaryContext;
    preview: RuleEditorStores['preview'];
    wire: RuleEditorStores['wire'];
    leafNodes: RuleEditorStores['leafNodes'];
    leafProblems: string[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        toast: import("@ui").ToastApi;
        isMobile: boolean;
        catalog: import("@tanstack/react-query").UseQueryResult<NoInfer<import("./types").Catalog>, Error>;
        create: import("@tanstack/react-query").UseMutationResult<import("./types").Rule, Error, RuleInput, unknown>;
        update: import("@tanstack/react-query").UseMutationResult<import("./types").Rule, Error, {
            id: string;
            input: RuleInput;
        }, unknown>;
        dir: import("./useDirectory").Directory;
        input: RuleInput;
        setInput: import("react").Dispatch<import("react").SetStateAction<RuleInput>>;
        tree: UiGroup;
        setTree: import("react").Dispatch<import("react").SetStateAction<UiGroup>>;
        preview: import("./useDirectory").ScopePreview;
        wire: import("./types").CondNode;
        leafNodes: import("./types").CondNode[];
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        detail: import("@tanstack/react-query").UseQueryResult<NoInfer<import("./api").RuleDetail>, Error>;
        pane: Pane;
        setPane: import("react").Dispatch<import("react").SetStateAction<Pane>>;
        leafCtx: LeafContext;
        summaryCtx: SummaryContext;
        leafProblems: string[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get isNew(): boolean;
    get limits(): RuleLimits;
    get trigger(): import("./types").TriggerRow | undefined;
    get readOnly(): boolean;
    get overDepth(): boolean;
    get overLeaves(): boolean;
    get nameOk(): boolean;
    get triggerOk(): boolean;
    get canSave(): boolean;
    get triggerOptions(): {
        value: string;
        label: string;
        description: string;
        group: string;
        disabled: boolean;
        keywords: string;
    }[];
    get basics(): import("react").JSX.Element;
    get conditions(): import("react").JSX.Element;
    get actionsPane(): import("react").JSX.Element;
    get scopePane(): import("react").JSX.Element;
    get modePane(): import("react").JSX.Element;
    get impactPane(): import("react").JSX.Element;
    get historyPane(): import("react").JSX.Element;
    get PANES(): Record<Pane, React.ReactNode>;
    get wizardSteps(): Pane[];
    get steps(): StepDef[];
    get tabs(): {
        id: Pane;
        label: string;
    }[];
    get stepIndex(): number;
    get busy(): boolean;
    get header(): import("react").JSX.Element;
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_main(): boolean;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_header(): {
        children: import("react").JSX.Element;
    };
    get show_error(): boolean;
    get show_leaf_problems(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        leafProblems: string[];
    };
    /** A part of the screen still written in React (<Callout> with element children). */
    get Part1(): typeof __parts.Part1;
    get show_not_is_new(): boolean;
    get part2_props(): {
        steps: StepDef[];
        stepIndex: number;
        setPane: import("react").Dispatch<import("react").SetStateAction<Pane>>;
        t: import("i18next").TFunction<"translation", undefined>;
        PANES: Record<Pane, import("react").ReactNode>;
        pane: Pane;
    };
    /** A part of the screen still written in React (<Stepper> steps: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        tabs: {
            id: Pane;
            label: string;
        }[];
        pane: Pane;
        setPane: import("react").Dispatch<import("react").SetStateAction<Pane>>;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Tabs> tabs: no .kbview property). */
    get Part3(): typeof __parts.Part3;
    get content_panes_pane(): {
        children: import("react").ReactNode;
    };
    get enabled_unless_step_index(): boolean;
    get show_step_index_wizard_steps(): boolean;
    get show_not_step_index_wizard_steps(): boolean;
    get enabled_unless_can_save(): boolean;
    /** `<RuleSummaryPanel>`, rendered by a ReactHost. */
    get RuleSummaryPanel(): import("react").FunctionComponent<Readonly<import("./RuleSummaryPanel").Props>>;
    get rule_summary_panel_props(): {
        input: {
            conditions: import("./types").CondNode;
            name: string;
            description: string | null;
            trigger: string;
            actions: import("./types").ActionSpec[];
            mode: import("./types").Mode;
            scope: import("./types").Scope;
            threshold_count: number | null;
            threshold_window_s: number | null;
            rollout_percent: number;
            severity: import("./types").Severity;
            priority: number;
            change_note?: string | null;
        };
        tree: UiGroup;
        ctx: SummaryContext;
        preview: import("./useDirectory").ScopePreview;
        flat: boolean;
    };
    get show_is_mobile_pane_conditions(): boolean;
    /** `<RuleSentence>`, rendered by a ReactHost. */
    get RuleSentence(): import("react").FunctionComponent<Readonly<import("./RuleSentence").RuleSentenceProps>>;
    get rule_sentence_props(): {
        input: {
            conditions: import("./types").CondNode;
            name: string;
            description: string | null;
            trigger: string;
            actions: import("./types").ActionSpec[];
            mode: import("./types").Mode;
            scope: import("./types").Scope;
            threshold_count: number | null;
            threshold_window_s: number | null;
            rollout_percent: number;
            severity: import("./types").Severity;
            priority: number;
            change_note?: string | null;
        };
        tree: UiGroup;
        ctx: SummaryContext;
    };
    set<K extends keyof RuleInput>(key: K, value: RuleInput[K]): void;
    setTrigger(key: string): void;
    payload(): RuleInput;
    save(): void;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setVerdicts` of the TSX: a value, or an update of the previous one. */
    setVerdicts(value: Record<string, Verdict> | null | ((prev: Record<string, Verdict> | null) => Record<string, Verdict> | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type RuleEditorStores = ReturnType<RuleEditor['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type RuleEditorHooks = ReturnType<RuleEditor['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<Props>>;
export default _default;
