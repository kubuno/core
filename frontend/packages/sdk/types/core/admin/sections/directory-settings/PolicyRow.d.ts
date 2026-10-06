import '../../settings/ProvenanceLine';
import type { ResolvedSetting } from '../../settings/scopeTypes';
import type { DirectoryPolicy } from './useDirectoryPolicy';
/**
 * One governed key: its control, then the sentence that says where the value
 * comes from.
 *
 * The provenance line is not optional decoration on this page. A directory
 * policy is the kind of thing an operator sets on one branch and then finds
 * inexplicably applied everywhere; `ProvenanceLine` is what states "inherited
 * from X" / "overridden here" / "locked by X", and it carries the revert, the
 * lock and the inheritance-chain window. Reusing the component rather than
 * restating it here is what keeps this page's affordances identical to every
 * other settings screen.
 */
/** Every control writes on the click — none of these values is free text. */
export interface RowProps {
    setting: ResolvedSetting | undefined;
    policy: DirectoryPolicy;
    readOnly: boolean;
    onShowChain: (key: string) => void;
}
/** Shared plumbing: a control is dead when a level above has locked the key. */
export declare function useRow(setting: ResolvedSetting | undefined, readOnly: boolean): {
    t: import("i18next").TFunction<"translation", undefined>;
    label: string;
    desc: string;
    disabled: boolean;
} | null;
