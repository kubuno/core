/**
 * Code-behind of `SupportCard.kbview` (converted from `SupportCard.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import ConfirmDialog from "@ui/ConfirmDialog";
import { type SupportInfo } from "./api";
import { ViewBase } from './SupportCard.kbview';
import * as __parts from './SupportCard.parts';
export type SupportCardProps = {
    support: SupportInfo;
    canManage: boolean;
};
export declare class SupportCard extends ViewBase {
    accessor formOpen: boolean;
    accessor draft: string;
    accessor error: string | null;
    tr: SupportCardStores['t'];
    i18n: SupportCardStores['i18n'];
    confirm: SupportCardStores['confirm'];
    confirmState: SupportCardStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    register: SupportCardStores['register'];
    remove: SupportCardStores['remove'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        confirm: (options: import("@ui/ConfirmDialog").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        register: import("@tanstack/react-query").UseMutationResult<import("./api").SupportContract, Error, string, unknown>;
        remove: import("@tanstack/react-query").UseMutationResult<void, Error, void, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get contract(): import("./api").SupportContract | null;
    get show_can_manage_contract(): boolean;
    get show_not_can_manage_contract(): boolean;
    get show_contract(): boolean;
    get show_not_contract(): boolean;
    /** `<ContractDetails>`, rendered by a ReactHost. */
    get ContractDetails(): typeof __parts.ContractDetails;
    get contract_details_props(): {
        contract: import("./api").SupportContract;
        locale: string;
        verificationAvailable: boolean;
    };
    /** `<CommunitySupport>`, rendered by a ReactHost. */
    get CommunitySupport(): typeof __parts.CommunitySupport;
    get community_support_props(): {
        support: SupportInfo;
    };
    get show_not_form_open(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        draft: string;
        setDraft: (value: SupportCard["draft"] | ((prev: SupportCard["draft"]) => SupportCard["draft"])) => void;
    };
    /** A part of the screen still written in React (<TextArea> spellCheck, autoComplete: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get enabled_unless_draft_trim(): boolean;
    get button_text(): string;
    get show_contract_form_open(): boolean;
    get show_error(): boolean;
    get show_confirm_state(): boolean;
    /** `<ConfirmDialog>`, rendered by a ReactHost. */
    get ConfirmDialog(): typeof ConfirmDialog;
    get confirm_dialog_props(): {
        onConfirm: () => void;
        onCancel: () => void;
        resolve: (ok: boolean) => void;
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        variant?: import("@ui/ConfirmDialog").ConfirmVariant;
        hideCancel?: boolean;
    };
    submit(): Promise<void>;
    askRemove(): Promise<void>;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click3(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click4(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setDraft` of the TSX: a value, or an update of the previous one. */
    setDraft(value: SupportCard['draft'] | ((prev: SupportCard['draft']) => SupportCard['draft'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type SupportCardStores = ReturnType<SupportCard['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<SupportCardProps>>;
export default _default;
