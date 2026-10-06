import { type Role } from "../../authz/types";
import { ViewBase } from './DelegabilityChip.kbview';
export type DelegabilityChipProps = {
    role: Role;
};
export declare class DelegabilityChip extends ViewBase {
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get show_not_role_ou_delegable(): boolean;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type DelegabilityChipStores = ReturnType<DelegabilityChip['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<DelegabilityChipProps>>;
export default _default;
