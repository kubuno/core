/**
 * Code-behind of `LabelsPage.kbview` (converted from `LabelsPage.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import ConfirmDialog from "@ui/ConfirmDialog";
import { type CoreLabel, type LabelBrowseItem } from "../api/labels";
import { DataCardView } from "../registry/DataCardView";
import LabelShareDialog from "../components/LabelShareDialog";
import { ViewBase } from './LabelsPage.kbview';
import * as __parts from './LabelsPage.parts';
export declare class LabelsPage extends ViewBase {
    accessor labels: CoreLabel[];
    accessor items: LabelBrowseItem[];
    accessor query: string;
    accessor moduleFilter: string;
    accessor newName: string;
    accessor loading: boolean;
    accessor sharing: CoreLabel | null;
    navigate: LabelsPageStores['navigate'];
    selected: Set<string>;
    setSelected: LabelsPageStores['setSelected'];
    confirm: LabelsPageStores['confirm'];
    confirmState: LabelsPageStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    refreshLabels: () => void;
    modules: string[];
    byId: Map<string, CoreLabel>;
    moduleOptions: {
        value: string;
        label: string;
    }[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        navigate: import("react-router").NavigateFunction;
        selected: Set<string>;
        setSelected: import("react").Dispatch<import("react").SetStateAction<Set<string>>>;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        refreshLabels: () => void;
        modules: string[];
        byId: Map<string, CoreLabel>;
        moduleOptions: {
            value: string;
            label: string;
        }[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    /** `<LabelIcon>`, rendered by a ReactHost. */
    get LabelIcon(): typeof import("../../ui/LabelIcon").LabelIcon;
    get label_icon_props(): {
        size: number;
        className: string;
    };
    get enabled_unless_new_name_trim(): boolean;
    /** `<LabelRow>`, rendered by a ReactHost. */
    get LabelRow(): typeof __parts.LabelRow;
    /** The rows of the Repeater over `labels`. */
    get rows_labels(): {
        l: CoreLabel;
        label_row_props: React.ComponentProps<typeof __parts.LabelRow>;
        key: string;
    }[];
    get show_labels(): boolean;
    get part1_props(): {
        query: string;
        setQuery: (value: LabelsPage["query"] | ((prev: LabelsPage["query"]) => LabelsPage["query"])) => void;
    };
    /** A part of the screen still written in React (<TextField LeftIcon>: an icon size the element cannot take). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        moduleFilter: string;
        setModuleFilter: (value: LabelsPage["moduleFilter"] | ((prev: LabelsPage["moduleFilter"]) => LabelsPage["moduleFilter"])) => void;
        moduleOptions: {
            value: string;
            label: string;
        }[];
    };
    /** A part of the screen still written in React (<Dropdown> height, width: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        selected: Set<string>;
        byId: Map<string, CoreLabel>;
        toggle: (id: string) => void;
    };
    /** A part of the screen still written in React (a list whose item is not a single element). */
    get Part3(): typeof __parts.Part3;
    get show_not_loading(): boolean;
    get show_items(): boolean;
    get show_not_items(): boolean;
    /** `<DataCardView>`, rendered by a ReactHost. */
    get DataCardView(): typeof DataCardView;
    /** A part of the screen still written in React (a list inside a list (nested Repeater)). */
    get Part4(): typeof __parts.Part4;
    /** The rows of the Repeater over `items`. */
    get rows_items(): {
        item: LabelBrowseItem;
        show_item_envelope: boolean | undefined;
        show_not_item_envelope: boolean | undefined;
        data_card_view_props: {
            envelope: import("../registry/DataTransferRegistry").KubunoDataEnvelope;
        } | undefined;
        p_text: string | undefined;
        p_text2: string | undefined;
        part4_props: {
            item: LabelBrowseItem;
            byId: Map<string, CoreLabel>;
            toggle: (id: string) => void;
        } | undefined;
        show_item_other_owners: boolean | undefined;
        p_text3: string | undefined;
        key: string;
    }[];
    get visible(): boolean;
    get visible2(): boolean;
    get show_sharing(): boolean;
    /** `<LabelShareDialog>`, rendered by a ReactHost. */
    get LabelShareDialog(): typeof LabelShareDialog;
    get label_share_dialog_props(): import("../components/LabelShareDialog").Props;
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
        variant?: import("@ui").ConfirmVariant;
        hideCancel?: boolean;
    };
    toggle(id: string): void;
    createLabel(): Promise<void>;
    text_field_key_down(_sender: unknown, args: EventArgs): void;
    panel_click(_sender: unknown, args: MouseEventArgs): undefined;
    /** `setLabels` of the TSX: a value, or an update of the previous one. */
    setLabels(value: CoreLabel[] | ((prev: CoreLabel[]) => CoreLabel[])): void;
    /** `setItems` of the TSX: a value, or an update of the previous one. */
    setItems(value: LabelBrowseItem[] | ((prev: LabelBrowseItem[]) => LabelBrowseItem[])): void;
    /** `setQuery` of the TSX: a value, or an update of the previous one. */
    setQuery(value: LabelsPage['query'] | ((prev: LabelsPage['query']) => LabelsPage['query'])): void;
    /** `setModuleFilter` of the TSX: a value, or an update of the previous one. */
    setModuleFilter(value: LabelsPage['moduleFilter'] | ((prev: LabelsPage['moduleFilter']) => LabelsPage['moduleFilter'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type LabelsPageStores = ReturnType<LabelsPage['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type LabelsPageHooks = ReturnType<LabelsPage['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
