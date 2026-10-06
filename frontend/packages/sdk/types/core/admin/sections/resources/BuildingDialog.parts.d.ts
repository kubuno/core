import type { BuildingDialog } from './BuildingDialog';
export declare function Part1({ t, key, building, setKey }: {
    t: NonNullable<BuildingDialog['tr']>;
    key: NonNullable<BuildingDialog['key']>;
    building: BuildingDialog['props']['building'];
    setKey: NonNullable<BuildingDialog['setKey']>;
}): import("react").JSX.Element;
export declare function Part2({ t, address, setAddress }: {
    t: NonNullable<BuildingDialog['tr']>;
    address: NonNullable<BuildingDialog['address']>;
    setAddress: NonNullable<BuildingDialog['setAddress']>;
}): import("react").JSX.Element;
export declare function Part3({ GeoPoint, lat, lon, address, busy, setLat, setLon }: {
    GeoPoint: NonNullable<BuildingDialog['GeoPoint']>;
    lat: NonNullable<BuildingDialog['lat']>;
    lon: NonNullable<BuildingDialog['lon']>;
    address: NonNullable<BuildingDialog['address']>;
    busy: NonNullable<BuildingDialog['busy']>;
    setLat: NonNullable<BuildingDialog['setLat']>;
    setLon: NonNullable<BuildingDialog['setLon']>;
}): import("react").JSX.Element;
export declare function Part4({ t, lat, setLat }: {
    t: NonNullable<BuildingDialog['tr']>;
    lat: NonNullable<BuildingDialog['lat']>;
    setLat: NonNullable<BuildingDialog['setLat']>;
}): import("react").JSX.Element;
export declare function Part5({ t, lon, setLon }: {
    t: NonNullable<BuildingDialog['tr']>;
    lon: NonNullable<BuildingDialog['lon']>;
    setLon: NonNullable<BuildingDialog['setLon']>;
}): import("react").JSX.Element;
export declare function Part6({ t, note, setNote }: {
    t: NonNullable<BuildingDialog['tr']>;
    note: NonNullable<BuildingDialog['note']>;
    setNote: NonNullable<BuildingDialog['setNote']>;
}): import("react").JSX.Element;
