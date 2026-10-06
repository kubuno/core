/**
 * Code-behind of `ResourceDialog.kbview` (converted from `ResourceDialog.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs, type ValueChangedEventArgs } from '@kubuno/views';
import { type Resource, type ResourceCategory, type ResourceInput } from "./api";
import { ViewBase } from './ResourceDialog.kbview';
import * as __parts from './ResourceDialog.parts';
export type ResourceDialogProps = {
    resource: Resource | null;
    onClose: () => void;
};
export declare class ResourceDialog extends ViewBase {
    accessor error: string | null;
    tr: ResourceDialogStores['t'];
    buildings: ResourceDialogStores['buildings'];
    features: ResourceDialogStores['features'];
    name: ResourceDialogHooks['name'];
    setName: ResourceDialogHooks['setName'];
    category: ResourceCategory;
    setCategory: ResourceDialogHooks['setCategory'];
    kind: ResourceDialogHooks['kind'];
    setKind: ResourceDialogHooks['setKind'];
    buildingId: ResourceDialogHooks['buildingId'];
    setBuildingId: ResourceDialogHooks['setBuildingId'];
    floor: ResourceDialogHooks['floor'];
    setFloor: ResourceDialogHooks['setFloor'];
    section: ResourceDialogHooks['section'];
    setSection: ResourceDialogHooks['setSection'];
    capacity: ResourceDialogHooks['capacity'];
    setCapacity: ResourceDialogHooks['setCapacity'];
    releaseExempt: ResourceDialogHooks['releaseExempt'];
    setReleaseExempt: ResourceDialogHooks['setReleaseExempt'];
    visible: ResourceDialogHooks['visible'];
    setVisible: ResourceDialogHooks['setVisible'];
    note: ResourceDialogHooks['note'];
    setNote: ResourceDialogHooks['setNote'];
    chosen: string[];
    setChosen: ResourceDialogHooks['setChosen'];
    create: ResourceDialogStores['create'];
    update: ResourceDialogStores['update'];
    buildingOptions: {
        value: string;
        label: string;
    }[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        buildings: import("@tanstack/react-query").UseQueryResult<NoInfer<import("./api").BuildingList>, Error>;
        features: import("@tanstack/react-query").UseQueryResult<NoInfer<{
            features: import("./api").ResourceFeature[];
        }>, Error>;
        create: import("@tanstack/react-query").UseMutationResult<unknown, Error, ResourceInput, unknown>;
        update: import("@tanstack/react-query").UseMutationResult<unknown, Error, {
            id: string;
            input: ResourceInput;
        }, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        name: string;
        setName: import("react").Dispatch<import("react").SetStateAction<string>>;
        category: ResourceCategory;
        setCategory: import("react").Dispatch<import("react").SetStateAction<ResourceCategory>>;
        kind: string;
        setKind: import("react").Dispatch<import("react").SetStateAction<string>>;
        buildingId: string;
        setBuildingId: import("react").Dispatch<import("react").SetStateAction<string>>;
        floor: string;
        setFloor: import("react").Dispatch<import("react").SetStateAction<string>>;
        section: string;
        setSection: import("react").Dispatch<import("react").SetStateAction<string>>;
        capacity: number;
        setCapacity: import("react").Dispatch<import("react").SetStateAction<number>>;
        releaseExempt: boolean;
        setReleaseExempt: import("react").Dispatch<import("react").SetStateAction<boolean>>;
        visible: string;
        setVisible: import("react").Dispatch<import("react").SetStateAction<string>>;
        note: string;
        setNote: import("react").Dispatch<import("react").SetStateAction<string>>;
        chosen: string[];
        setChosen: import("react").Dispatch<import("react").SetStateAction<string[]>>;
        buildingOptions: {
            value: string;
            label: string;
        }[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get busy(): boolean;
    get buildingList(): import("./api").Building[];
    get building(): import("./api").Building | undefined;
    get floorOptions(): {
        value: string;
        label: string;
    }[];
    get noBuildings(): boolean;
    get enabled_unless_busy_no_buildings(): boolean;
    get title(): string;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (./FieldLabel#default)). */
    get Part1(): typeof __parts.Part1;
    get div_text(): string;
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (./FieldLabel#default)). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        category: ResourceCategory;
        setCategory: import("react").Dispatch<import("react").SetStateAction<ResourceCategory>>;
        setKind: import("react").Dispatch<import("react").SetStateAction<string>>;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Dropdown> width, height, focusable: no .kbview property). */
    get Part3(): typeof __parts.Part3;
    get span_text(): string;
    get show_category_other(): boolean;
    get part4_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        name: string;
        resource: Resource | null;
        setName: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    /** A part of the screen still written in React (<TextField> autoFocus: no .kbview property). */
    get Part4(): typeof __parts.Part4;
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (./FieldLabel#default)). */
    get Part5(): typeof __parts.Part5;
    get part6_props(): {
        buildingId: string;
        setBuildingId: import("react").Dispatch<import("react").SetStateAction<string>>;
        setFloor: import("react").Dispatch<import("react").SetStateAction<string>>;
        buildingOptions: {
            value: string;
            label: string;
        }[];
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Dropdown> width, height, focusable: no .kbview property). */
    get Part6(): typeof __parts.Part6;
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (./FieldLabel#default)). */
    get Part7(): typeof __parts.Part7;
    get part8_props(): {
        floor: string;
        setFloor: import("react").Dispatch<import("react").SetStateAction<string>>;
        floorOptions: {
            value: string;
            label: string;
        }[];
        t: import("i18next").TFunction<"translation", undefined>;
        building: import("./api").Building | undefined;
    };
    /** A part of the screen still written in React (<Dropdown> width, height, focusable: no .kbview property). */
    get Part8(): typeof __parts.Part8;
    get show_category_meeting_room(): boolean;
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (./FieldLabel#default)). */
    get Part9(): typeof __parts.Part9;
    get show_features_data_features(): boolean;
    get show_not_features_data_features(): boolean;
    /** The rows of the Repeater over `(features.data?.features ?? [])`. */
    get rows_items(): {
        f: import("./api").ResourceFeature;
        checked: boolean | undefined;
        key: string;
    }[];
    get part10_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        visible: string;
        setVisible: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    /** A part of the screen still written in React (<TextArea> rows: no .kbview property). */
    get Part10(): typeof __parts.Part10;
    get part11_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        note: string;
        setNote: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    /** A part of the screen still written in React (<TextArea> rows: no .kbview property). */
    get Part11(): typeof __parts.Part11;
    get show_error(): boolean;
    submit(): Promise<void>;
    panel_mouse_down(_sender: unknown, args: MouseEventArgs): void;
    floating_window_confirm(_sender: unknown, _args: EventArgs): void;
    floating_window_close(_sender: unknown, _args: EventArgs): void;
    text_field_text_changed(_sender: unknown, args: EventArgs): undefined;
    text_field_text_changed2(_sender: unknown, args: EventArgs): void;
    numeric_field_value_changed(_sender: unknown, args: ValueChangedEventArgs): void;
    check_box_checked_changed(_sender: unknown, args: ValueChangedEventArgs): undefined;
    check_box_checked_changed2(_sender: unknown, args: ValueChangedEventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ResourceDialogStores = ReturnType<ResourceDialog['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ResourceDialogHooks = ReturnType<ResourceDialog['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<ResourceDialogProps>>;
export default _default;
