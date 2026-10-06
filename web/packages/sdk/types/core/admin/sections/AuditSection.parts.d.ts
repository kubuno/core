import { type AuditEntry } from "./auditTypes";
import type { AuditSection } from './AuditSection';
declare function EntryDetail({ entry }: {
    entry: AuditEntry;
}): import("react").JSX.Element;
export { EntryDetail };
export declare function Part1({ exportCsv, t }: {
    exportCsv: AuditSection['exportCsv'];
    t: NonNullable<AuditSection['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ draft, setDraft, t }: {
    draft: NonNullable<AuditSection['draft']>;
    setDraft: NonNullable<AuditSection['setDraft']>;
    t: NonNullable<AuditSection['tr']>;
}): import("react").JSX.Element;
export declare function Part3({ filters, set, opt, facets, t }: {
    filters: NonNullable<AuditSection['filters']>;
    set: AuditSection['set'];
    opt: AuditSection['opt'];
    facets: AuditSection['facets'];
    t: NonNullable<AuditSection['tr']>;
}): import("react").JSX.Element;
export declare function Part4({ filters, set, opt, facets, t }: {
    filters: NonNullable<AuditSection['filters']>;
    set: AuditSection['set'];
    opt: AuditSection['opt'];
    facets: AuditSection['facets'];
    t: NonNullable<AuditSection['tr']>;
}): import("react").JSX.Element;
export declare function Part5({ filters, set, opt, facets, t }: {
    filters: NonNullable<AuditSection['filters']>;
    set: AuditSection['set'];
    opt: AuditSection['opt'];
    facets: AuditSection['facets'];
    t: NonNullable<AuditSection['tr']>;
}): import("react").JSX.Element;
export declare function Part6({ filters, set, t, facets }: {
    filters: NonNullable<AuditSection['filters']>;
    set: AuditSection['set'];
    t: NonNullable<AuditSection['tr']>;
    facets: AuditSection['facets'];
}): import("react").JSX.Element;
export declare function Part7({ t, filters, set }: {
    t: NonNullable<AuditSection['tr']>;
    filters: NonNullable<AuditSection['filters']>;
    set: AuditSection['set'];
}): import("react").JSX.Element;
export declare function Part8({ t, filters, set }: {
    t: NonNullable<AuditSection['tr']>;
    filters: NonNullable<AuditSection['filters']>;
    set: AuditSection['set'];
}): import("react").JSX.Element;
export declare function Part9({ t, rows, isLoading, open, setOpen, i18n }: {
    t: NonNullable<AuditSection['tr']>;
    rows: NonNullable<AuditSection['rows']>;
    isLoading: NonNullable<AuditSection['isLoading']>;
    open: AuditSection['open'];
    setOpen: NonNullable<AuditSection['setOpen']>;
    i18n: NonNullable<AuditSection['i18n']>;
}): import("react").JSX.Element;
