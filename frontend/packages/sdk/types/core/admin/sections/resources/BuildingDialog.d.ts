/**
 * Code-behind of `BuildingDialog.kbview` (converted from `BuildingDialog.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import { type GeoPointFieldProps } from "../../geoPointField";
import { type Building, type BuildingInput } from "./api";
import { ViewBase } from './BuildingDialog.kbview';
import * as __parts from './BuildingDialog.parts';
export type BuildingDialogProps = {
    /** `null` opens an empty sheet. */
    building: Building | null;
    floorMax: number;
    onClose: () => void;
};
export declare class BuildingDialog extends ViewBase {
    accessor error: string | null;
    tr: BuildingDialogStores['t'];
    key: BuildingDialogHooks['key'];
    setKey: BuildingDialogHooks['setKey'];
    name: BuildingDialogHooks['name'];
    setName: BuildingDialogHooks['setName'];
    address: BuildingDialogHooks['address'];
    setAddress: BuildingDialogHooks['setAddress'];
    note: BuildingDialogHooks['note'];
    setNote: BuildingDialogHooks['setNote'];
    lat: BuildingDialogHooks['lat'];
    setLat: BuildingDialogHooks['setLat'];
    lon: BuildingDialogHooks['lon'];
    setLon: BuildingDialogHooks['setLon'];
    floors: string[];
    setFloors: BuildingDialogHooks['setFloors'];
    create: BuildingDialogStores['create'];
    update: BuildingDialogStores['update'];
    GeoPoint: BuildingDialogStores['GeoPoint'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        create: import("@tanstack/react-query").UseMutationResult<unknown, Error, BuildingInput, unknown>;
        update: import("@tanstack/react-query").UseMutationResult<unknown, Error, {
            id: string;
            input: BuildingInput;
        }, unknown>;
        activeModules: import("../../../types").ActiveModule[];
        loadedVersion: number;
        GeoPoint: import("react").ComponentType<GeoPointFieldProps> | null;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        key: string;
        setKey: import("react").Dispatch<import("react").SetStateAction<string>>;
        name: string;
        setName: import("react").Dispatch<import("react").SetStateAction<string>>;
        address: string;
        setAddress: import("react").Dispatch<import("react").SetStateAction<string>>;
        note: string;
        setNote: import("react").Dispatch<import("react").SetStateAction<string>>;
        lat: string;
        setLat: import("react").Dispatch<import("react").SetStateAction<string>>;
        lon: string;
        setLon: import("react").Dispatch<import("react").SetStateAction<string>>;
        floors: string[];
        setFloors: import("react").Dispatch<import("react").SetStateAction<string[]>>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get busy(): boolean;
    get enabled_unless_busy(): boolean;
    get show_error(): boolean;
    get show_not_error(): boolean;
    get title(): string;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        key: string;
        building: Building | null;
        setKey: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    /** A part of the screen still written in React (<TextField> autoFocus: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        address: string;
        setAddress: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    /** A part of the screen still written in React (<TextArea> rows: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    /** `<FloorsField>`, rendered by a ReactHost. */
    get FloorsField(): import("react").FunctionComponent<Readonly<import("./FloorsField").FloorsFieldProps>>;
    get floors_field_props(): {
        floors: string[];
        onChange: import("react").Dispatch<import("react").SetStateAction<string[]>>;
        maxLength: number;
        maxFloors: number;
        disabled: boolean;
    };
    get show_building_building_resource(): boolean;
    get res_building_rename_warning_count(): number;
    get show_geo_point(): boolean;
    get show_not_geo_point(): boolean;
    get part3_props(): {
        GeoPoint: import("react").ComponentType<GeoPointFieldProps>;
        lat: string;
        lon: string;
        address: string;
        busy: boolean;
        setLat: import("react").Dispatch<import("react").SetStateAction<string>>;
        setLon: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    /** A part of the screen still written in React (<GeoPoint> is no .kbview element (a local or dynamic component)). */
    get Part3(): typeof __parts.Part3;
    get part4_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        lat: string;
        setLat: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    /** A part of the screen still written in React (<TextField> inputMode: no .kbview property). */
    get Part4(): typeof __parts.Part4;
    get part5_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        lon: string;
        setLon: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    /** A part of the screen still written in React (<TextField> inputMode: no .kbview property). */
    get Part5(): typeof __parts.Part5;
    get part6_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        note: string;
        setNote: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    /** A part of the screen still written in React (<TextArea> rows: no .kbview property). */
    get Part6(): typeof __parts.Part6;
    submit(): Promise<void>;
    panel_mouse_down(_sender: unknown, args: MouseEventArgs): void;
    floating_window_confirm(_sender: unknown, _args: EventArgs): void;
    floating_window_close(_sender: unknown, _args: EventArgs): void;
    text_field_text_changed(_sender: unknown, args: EventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type BuildingDialogStores = ReturnType<BuildingDialog['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type BuildingDialogHooks = ReturnType<BuildingDialog['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<BuildingDialogProps>>;
export default _default;
