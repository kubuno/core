import { type ReactNode } from "react";
import { type AdminNavItem, type NavMeta } from "./adminNav";
import { type ModuleLiveState } from "./adminModules";
import { type ModuleGlyph } from "./nav/moduleGlyph";
import { ViewBase } from './AdminNavTree.kbview';
import * as __parts from './AdminNavTree.parts';
interface DynamicNavChild {
    /** Record id — the segment after the section (`/admin/modules/<id>`). */
    id: string;
    /** Already-translated label: a display name, not a translation key. */
    label: string;
    /**
     * The module's own glyph, as it appears everywhere else in the product — a
     * row of twenty-odd names reads as a list; the same row with each
     * application's icon reads as the applications the operator already knows.
     *
     * A component, not an icon name, because `WaffleAppRegistry` is where a
     * module's face is actually decided and some of them are BRAND LOGOS in
     * colour (PaintSharp), which no name-to-Lucide map can express.
     */
    Icon?: ModuleGlyph | null;
    /** How the row is toned down or flagged, and why (shown as its tooltip). */
    state: ModuleLiveState;
    /**
     * The first page the record declares, when it declares any.
     *
     * Only the FIRST one, because that is all this tree needs: the row links
     * straight to it rather than to the record's bare address, which would
     * redirect on arrival and make the view flicker. The other pages are the
     * business of the record's own page.
     */
    firstPane: string | null;
}
export type AdminNavTreeProps = {
    collapsed?: boolean;
};
export declare class AdminNavTree extends ViewBase {
    tr: AdminNavTreeStores['t'];
    can: AdminNavTreeStores['can'];
    place: AdminNavTreeStores['place'];
    dynamic: Record<string, DynamicNavChild[]>;
    pins: AdminNavTreeStores['pins'];
    nav: AdminNavItem[];
    showMore: AdminNavTreeHooks['showMore'];
    setShowMore: AdminNavTreeHooks['setShowMore'];
    expanded: Set<string>;
    setExpanded: AdminNavTreeHooks['setExpanded'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../authz/types").CanFn;
        place: import("./adminRoute").AdminPlace;
        dynamic: Record<string, DynamicNavChild[]>;
        pins: import("./nav/adminPins").AdminPins;
        nav: AdminNavItem[];
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        showMore: boolean;
        setShowMore: import("react").Dispatch<import("react").SetStateAction<boolean>>;
        expanded: Set<string>;
        setExpanded: import("react").Dispatch<import("react").SetStateAction<Set<string>>>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get active(): string;
    get activeMeta(): NavMeta | undefined;
    get LINK_CLASS(): "flex h-full min-w-0 flex-1 items-center gap-3";
    get CARET_SLOT(): "flex h-6 w-[22px] shrink-0 items-center justify-center";
    get caretSpacer(): import("react").JSX.Element;
    get INDENT_STEP(): 22;
    get ICON_SLOT(): 20;
    get LABEL_GAP(): 12;
    get BASE_INSET(): 4;
    get primary(): AdminNavItem[];
    get secondary(): AdminNavItem[];
    get pinned(): NavMeta[];
    get show_case_1(): boolean;
    /** A part of the screen still written in React (<Link aria-current>). */
    get Part1(): typeof __parts.Part1;
    /** The rows of the Repeater over `nav`. */
    get rows_nav(): {
        it: AdminNavItem;
        part1_props: {
            it: AdminNavItem;
            t: import("i18next").TFunction<"translation", undefined>;
            activeMeta: NavMeta | undefined;
            It_Icon: import("lucide-react").LucideIcon | undefined;
        } | undefined;
        key: string;
    }[];
    get show_main(): boolean;
    get show_pinned(): boolean;
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part2(): typeof __parts.Part2;
    /** The rows of the Repeater over `pinned`. */
    get rows_pinned(): {
        meta: NavMeta;
        TopIcon: import("lucide-react").LucideIcon | undefined;
        label: string;
        isActive: boolean;
        part2_props: {
            meta: NavMeta;
            indent: (depth: number) => number;
            rowClass: (isActive: boolean, holdsActive: boolean) => string;
            isActive: boolean;
            caretSpacer: import("react").JSX.Element;
            label: string;
            LINK_CLASS: "flex h-full min-w-0 flex-1 items-center gap-3";
            TopIcon: import("lucide-react").LucideIcon | undefined;
            t: import("i18next").TFunction<"translation", undefined>;
            pins: import("./nav/adminPins").AdminPins;
        } | undefined;
        key: string;
    }[];
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_render_items_primary(): {
        children: ReactNode;
    };
    get content_show_more_render_items_secondary(): {
        children: ReactNode;
    };
    get show_secondary(): boolean;
    get part3_props(): {
        showMore: boolean;
        setShowMore: import("react").Dispatch<import("react").SetStateAction<boolean>>;
        indent: (depth: number) => number;
        rowClass: (isActive: boolean, holdsActive: boolean) => string;
        CARET_SLOT: "flex h-6 w-[22px] shrink-0 items-center justify-center";
        caretIcon: (open: boolean) => import("react").JSX.Element;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<a aria-expanded>: attribute(s) without a .kbview property). */
    get Part3(): typeof __parts.Part3;
    get part4_props(): {
        indent: (depth: number) => number;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Link style>). */
    get Part4(): typeof __parts.Part4;
    toggle(id: string): void;
    rowClass(isActive: boolean, holdsActive: boolean): string;
    caretIcon(open: boolean): import("react").JSX.Element;
    indent(depth: number): number;
    renderDynamic(tab: string, children: DynamicNavChild[], depth: number): ReactNode;
    renderItems(items: AdminNavItem[], depth: number): ReactNode;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AdminNavTreeStores = ReturnType<AdminNavTree['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type AdminNavTreeHooks = ReturnType<AdminNavTree['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminNavTreeProps>>;
export default _default;
