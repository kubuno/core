import type { ResourceDialog } from './ResourceDialog';
export declare function Part1({ t }: {
    t: NonNullable<ResourceDialog['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ t }: {
    t: NonNullable<ResourceDialog['tr']>;
}): import("react").JSX.Element;
export declare function Part3({ category, setCategory, setKind, t }: {
    category: NonNullable<ResourceDialog['category']>;
    setCategory: NonNullable<ResourceDialog['setCategory']>;
    setKind: NonNullable<ResourceDialog['setKind']>;
    t: NonNullable<ResourceDialog['tr']>;
}): import("react").JSX.Element;
export declare function Part4({ t, name, resource, setName }: {
    t: NonNullable<ResourceDialog['tr']>;
    name: NonNullable<ResourceDialog['name']>;
    resource: ResourceDialog['props']['resource'];
    setName: NonNullable<ResourceDialog['setName']>;
}): import("react").JSX.Element;
export declare function Part5({ t }: {
    t: NonNullable<ResourceDialog['tr']>;
}): import("react").JSX.Element;
export declare function Part6({ buildingId, setBuildingId, setFloor, buildingOptions, t }: {
    buildingId: NonNullable<ResourceDialog['buildingId']>;
    setBuildingId: NonNullable<ResourceDialog['setBuildingId']>;
    setFloor: NonNullable<ResourceDialog['setFloor']>;
    buildingOptions: NonNullable<ResourceDialog['buildingOptions']>;
    t: NonNullable<ResourceDialog['tr']>;
}): import("react").JSX.Element;
export declare function Part7({ t }: {
    t: NonNullable<ResourceDialog['tr']>;
}): import("react").JSX.Element;
export declare function Part8({ floor, setFloor, floorOptions, t, building }: {
    floor: NonNullable<ResourceDialog['floor']>;
    setFloor: NonNullable<ResourceDialog['setFloor']>;
    floorOptions: NonNullable<ResourceDialog['floorOptions']>;
    t: NonNullable<ResourceDialog['tr']>;
    building: ResourceDialog['building'];
}): import("react").JSX.Element;
export declare function Part9({ t }: {
    t: NonNullable<ResourceDialog['tr']>;
}): import("react").JSX.Element;
export declare function Part10({ t, visible, setVisible }: {
    t: NonNullable<ResourceDialog['tr']>;
    visible: NonNullable<ResourceDialog['visible']>;
    setVisible: NonNullable<ResourceDialog['setVisible']>;
}): import("react").JSX.Element;
export declare function Part11({ t, note, setNote }: {
    t: NonNullable<ResourceDialog['tr']>;
    note: NonNullable<ResourceDialog['note']>;
    setNote: NonNullable<ResourceDialog['setNote']>;
}): import("react").JSX.Element;
