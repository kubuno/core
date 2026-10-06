import ConfirmDialog from "@ui/ConfirmDialog";
import { type AudienceMember } from "./api";
import IdentityCard from "./IdentityCard";
import { ViewBase } from './AudienceSheet.kbview';
import * as __parts from './AudienceSheet.parts';
export type AudienceSheetProps = {
    id: string;
    canManage: boolean;
};
export declare class AudienceSheet extends ViewBase {
    accessor adding: boolean;
    tr: AudienceSheetStores['t'];
    data: AudienceSheetHooks['data'];
    isLoading: boolean;
    addMembers: AudienceSheetHooks['addMembers'];
    removeMembers: AudienceSheetHooks['removeMembers'];
    confirm: AudienceSheetStores['confirm'];
    confirmState: AudienceSheetStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        confirm: (options: import("@ui/ConfirmDialog").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<import("./api").AudienceSheet> | undefined;
        isLoading: boolean;
        addMembers: import("@tanstack/react-query").UseMutationResult<any, Error, {
            id: string;
            members: {
                member_type: string;
                member_id: string;
            }[];
        }, unknown>;
        removeMembers: import("@tanstack/react-query").UseMutationResult<any, Error, {
            id: string;
            members: {
                member_type: string;
                member_id: string;
            }[];
        }, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get a(): import("./api").Audience;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get show_not_a_is_everyone(): boolean;
    get show_a_is_everyone(): boolean;
    get span_text(): string;
    /** `<IdentityCard>`, rendered by a ReactHost. */
    get IdentityCard(): typeof IdentityCard;
    get identity_card_props(): {
        audience: import("./api").Audience;
        canManage: boolean;
    };
    get show_not_can_manage(): boolean;
    get part1_props(): {
        setAdding: (value: AudienceSheet["adding"] | ((prev: AudienceSheet["adding"]) => AudienceSheet["adding"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part1(): typeof __parts.Part1;
    get show_data_members(): boolean;
    get show_not_data_members(): boolean;
    /** `<MemberRow>`, rendered by a ReactHost. */
    get MemberRow(): typeof __parts.MemberRow;
    /** The rows of the Repeater over `data.members`. */
    get rows_members(): {
        m: AudienceMember;
        member_row_props: {
            m: AudienceMember;
            canManage: boolean;
            onRemove: () => void;
        } | undefined;
        key: string;
    }[];
    get show_data_applied(): boolean;
    get show_not_data_applied(): boolean;
    /** The rows of the Repeater over `data.applied`. */
    get rows_applied(): {
        p: import("./api").AppliedAt;
        show_p_position: boolean | undefined;
        key: string;
    }[];
    /** `<MemberPicker>`, rendered by a ReactHost. */
    get MemberPicker(): import("react").FunctionComponent<Readonly<import("./MemberPicker").MemberPickerProps>>;
    get member_picker_props(): Readonly<import("./MemberPicker").MemberPickerProps>;
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
    removeOne(m: AudienceMember): Promise<undefined>;
    /** `setAdding` of the TSX: a value, or an update of the previous one. */
    setAdding(value: AudienceSheet['adding'] | ((prev: AudienceSheet['adding']) => AudienceSheet['adding'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AudienceSheetStores = ReturnType<AudienceSheet['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type AudienceSheetHooks = ReturnType<AudienceSheet['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<AudienceSheetProps>>;
export default _default;
