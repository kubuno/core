import type { ScopeRef } from "./types";
import type { Directory } from "./useDirectory";
import type { ScopeEditor } from './ScopeEditor';
declare function RefRow({ r, dir, onRemove, onToggleDescendants, disabled }: {
    r: ScopeRef;
    dir: Directory;
    onRemove: () => void;
    onToggleDescendants?: (v: boolean) => void;
    disabled?: boolean;
}): import("react").JSX.Element;
export { RefRow };
export declare function Part1({ Bucket, includeMenu }: {
    Bucket: ScopeEditor['Bucket'];
    includeMenu: NonNullable<ScopeEditor['includeMenu']>;
}): import("react").JSX.Element;
export declare function Part2({ Bucket, excludeMenu }: {
    Bucket: ScopeEditor['Bucket'];
    excludeMenu: NonNullable<ScopeEditor['excludeMenu']>;
}): import("react").JSX.Element;
