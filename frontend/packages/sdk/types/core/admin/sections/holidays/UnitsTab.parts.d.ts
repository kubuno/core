import type { UnitsTab } from './UnitsTab';
export declare function Part1({ t }: {
    t: NonNullable<UnitsTab['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ setPicking, unitName, t }: {
    setPicking: NonNullable<UnitsTab['setPicking']>;
    unitName: NonNullable<UnitsTab['unitName']>;
    t: NonNullable<UnitsTab['tr']>;
}): import("react").JSX.Element;
export declare function Part3({ t }: {
    t: NonNullable<UnitsTab['tr']>;
}): import("react").JSX.Element;
export declare function Part4({ adding, t, calendars, setAdding }: {
    adding: NonNullable<UnitsTab['adding']>;
    t: NonNullable<UnitsTab['tr']>;
    calendars: UnitsTab['calendars'];
    setAdding: NonNullable<UnitsTab['setAdding']>;
}): import("react").JSX.Element;
export declare function Part5({ adding, setPref, setError, setAdding, fail, t }: {
    adding: NonNullable<UnitsTab['adding']>;
    setPref: NonNullable<UnitsTab['setPref']>;
    setError: NonNullable<UnitsTab['setError']>;
    setAdding: NonNullable<UnitsTab['setAdding']>;
    fail: UnitsTab['fail'];
    t: NonNullable<UnitsTab['tr']>;
}): import("react").JSX.Element;
export declare function Part6({ t, setError, setPref, pref, fail }: {
    t: NonNullable<UnitsTab['tr']>;
    setError: NonNullable<UnitsTab['setError']>;
    setPref: NonNullable<UnitsTab['setPref']>;
    pref: NonNullable<UnitsTab['rows_items']>[number]['pref'];
    fail: UnitsTab['fail'];
}): import("react").JSX.Element;
