export declare const RESOURCES_KEY: readonly ["admin-resources"];
export declare const BUILDINGS_KEY: readonly ["admin-buildings"];
export declare const FEATURES_KEY: readonly ["admin-resource-features"];
export declare const OVERVIEW_KEY: readonly ["admin-resources-overview"];
/** The closed category vocabulary, mirroring the column's CHECK. */
export type ResourceCategory = 'meeting_room' | 'other';
export interface Building {
    id: string;
    building_key: string;
    name: string | null;
    address: string;
    description: string | null;
    latitude: number | null;
    longitude: number | null;
    /** In display order, lowest first. The order is data, not a sort. */
    floors: string[];
    resource_count: number;
}
export interface ResourceFeature {
    id: string;
    name: string;
    description: string | null;
    resource_count: number;
}
/** The building fields carried alongside every resource row. */
export interface ResourceBuilding {
    id: string;
    key: string;
    name: string | null;
    address: string;
    latitude: number | null;
    longitude: number | null;
}
export interface Resource {
    id: string;
    name: string;
    /** Composed by the server, never typed. What everybody outside this page reads. */
    generated_name: string;
    category: ResourceCategory;
    resource_type: string | null;
    floor_name: string;
    floor_section: string | null;
    capacity: number;
    /** Never handed back automatically when its meeting empties out. */
    release_exempt: boolean;
    user_description: string | null;
    description: string | null;
    /** The building it sits in, exactly as the internal catalogue publishes it. */
    building: ResourceBuilding;
    feature_ids: string[];
    feature_names: string[];
}
export interface ResourceOverview {
    buildings: number;
    resources: number;
    features: number;
    rooms: number;
    room_seats: number;
    /** The three gaps — what makes the inventory unfinished rather than absent. */
    empty_buildings: number;
    undescribed: number;
    unused_features: number;
}
export interface BuildingInput {
    building_key: string;
    name: string | null;
    address: string;
    description: string | null;
    latitude: number | null;
    longitude: number | null;
    floors: string[];
}
export interface ResourceInput {
    name: string;
    building_id: string;
    category: ResourceCategory;
    resource_type: string | null;
    floor_name: string;
    floor_section: string | null;
    capacity: number;
    user_description: string | null;
    description: string | null;
    feature_ids: string[];
    release_exempt: boolean;
}
export interface FeatureInput {
    name: string;
    description: string | null;
}
export interface BuildingList {
    buildings: Building[];
    limits: {
        floors: number;
        floor_name: number;
    };
}
export interface ResourceList {
    resources: Resource[];
    categories: ResourceCategory[];
    limits: {
        name: number;
        floor_name: number;
        floor_section: number;
        capacity: number;
        description: number;
    };
}
export declare function useResourceOverview(): import("@tanstack/react-query").UseQueryResult<NoInfer<ResourceOverview>, Error>;
export declare function useBuildings(): import("@tanstack/react-query").UseQueryResult<NoInfer<BuildingList>, Error>;
export declare function useResources(): import("@tanstack/react-query").UseQueryResult<NoInfer<ResourceList>, Error>;
export declare function useResourceFeatures(): import("@tanstack/react-query").UseQueryResult<NoInfer<{
    features: ResourceFeature[];
}>, Error>;
export declare function useCreateBuilding(): import("@tanstack/react-query").UseMutationResult<unknown, Error, BuildingInput, unknown>;
export declare function useUpdateBuilding(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    id: string;
    input: BuildingInput;
}, unknown>;
export declare function useDeleteBuilding(): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useCreateResource(): import("@tanstack/react-query").UseMutationResult<unknown, Error, ResourceInput, unknown>;
export declare function useUpdateResource(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    id: string;
    input: ResourceInput;
}, unknown>;
export declare function useDeleteResource(): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useCreateFeature(): import("@tanstack/react-query").UseMutationResult<unknown, Error, FeatureInput, unknown>;
export declare function useUpdateFeature(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    id: string;
    input: FeatureInput;
}, unknown>;
export declare function useDeleteFeature(): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
/** One implementation, shared: reading the failure of a request is the same
 *  problem everywhere. Re-exported under the name this section's callers
 *  already use. */
export { apiErrorMessage as errorMessage } from '../../../api/errorMessage';
export interface RoomStats {
    /** False when the module that holds the bookings is not installed or silent. */
    available: boolean;
    reason?: 'module_absent' | 'unreachable' | 'refused' | 'unreadable';
    bookings: number;
    booked_hours: number;
    declined: number;
    released_hours: number;
    rooms: number;
    available_hours: number;
    /** `null` when there is no room at all — a rate over nothing is not zero. */
    booking_rate: number | null;
    per_day: {
        date: string;
        hours: number;
        bookings: number;
    }[];
    /** `hour` is read on a clock in the zone the request named, not in UTC. */
    per_hour: {
        hour: number;
        hours: number;
    }[];
    per_room: {
        resource_id: string;
        name: string;
        capacity: number;
        hours: number;
        bookings: number;
        declined: number;
    }[];
}
/** The figures are the calendar's, relayed by the core: the console never reads
 *  another component's schema.
 *
 *  The browser's own zone travels with the window. "Nine o'clock" and "Monday"
 *  are what a clock somewhere says about an instant, so the buckets have to be
 *  cut where the person reading them lives — bucketed in UTC, a Paris morning
 *  meeting would show up an hour early. */
export declare function useRoomStats(from: string, to: string, enabled: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<RoomStats>, Error>;
