import { useMenuDropdown, type MenuItem } from "@ui";
import type { Scope, ScopeRef } from "./types";
import type { Directory } from "./useDirectory";
import { ViewBase } from './ScopeEditor.kbview';
import * as __parts from './ScopeEditor.parts';
interface Props {
    value: Scope;
    onChange: (next: Scope) => void;
    dir: Directory;
    maxRefs: number;
    disabled?: boolean;
}
type Bucket = 'include' | 'exclude';
export type { Props };
export declare class ScopeEditor extends ViewBase {
    tr: ScopeEditorStores['t'];
    includeMenu: ScopeEditorStores['includeMenu'];
    excludeMenu: ScopeEditorStores['excludeMenu'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        includeMenu: {
            pos: import("@ui").MenuDropdownPos | null;
            open: (e: React.MouseEvent | React.MouseEvent<HTMLElement>) => void;
            openAt: (x: number, y: number) => void;
            close: () => void;
            isOpen: boolean;
        };
        excludeMenu: {
            pos: import("@ui").MenuDropdownPos | null;
            open: (e: React.MouseEvent | React.MouseEvent<HTMLElement>) => void;
            openAt: (x: number, y: number) => void;
            close: () => void;
            isOpen: boolean;
        };
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get total(): number;
    get full(): boolean;
    get userOptions(): {
        value: string;
        label: string;
        description: string;
        keywords: string;
    }[];
    get show_value_include(): boolean;
    get part1_props(): {
        Bucket: ({ bucket, menu }: {
            bucket: Bucket;
            menu: ReturnType<typeof useMenuDropdown>;
        }) => import("react").JSX.Element;
        includeMenu: {
            pos: import("@ui").MenuDropdownPos | null;
            open: (e: React.MouseEvent | React.MouseEvent<HTMLElement>) => void;
            openAt: (x: number, y: number) => void;
            close: () => void;
            isOpen: boolean;
        };
    };
    /** A part of the screen still written in React (<Bucket> is no .kbview element (a local or dynamic component)). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        Bucket: ({ bucket, menu }: {
            bucket: Bucket;
            menu: ReturnType<typeof useMenuDropdown>;
        }) => import("react").JSX.Element;
        excludeMenu: {
            pos: import("@ui").MenuDropdownPos | null;
            open: (e: React.MouseEvent | React.MouseEvent<HTMLElement>) => void;
            openAt: (x: number, y: number) => void;
            close: () => void;
            isOpen: boolean;
        };
    };
    /** A part of the screen still written in React (<Bucket> is no .kbview element (a local or dynamic component)). */
    get Part2(): typeof __parts.Part2;
    get p_text(): string;
    add(bucket: Bucket, ref: ScopeRef): void;
    remove(bucket: Bucket, key: string): void;
    buildMenu(bucket: Bucket): MenuItem[];
    Bucket({ bucket, menu }: {
        bucket: Bucket;
        menu: ReturnType<typeof useMenuDropdown>;
    }): import("react").JSX.Element;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ScopeEditorStores = ReturnType<ScopeEditor['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<Props>>;
export default _default;
