import type { User } from "../../../types";
import PasswordResetCard from "./PasswordResetCard";
import RequirePasswordChangeCard from "./RequirePasswordChangeCard";
import { ViewBase } from './SecurityTab.kbview';
import * as __parts from './SecurityTab.parts';
export type SecurityTabProps = {
    user: User;
};
export declare class SecurityTab extends ViewBase {
    tr: SecurityTabStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get variant(): "success" | "warning";
    get title(): string;
    get callout_text(): string;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        user: User;
        user_oauth_provider: string | null;
    };
    /** A part of the screen still written in React (<dl> has no .kbview element yet). */
    get Part1(): typeof __parts.Part1;
    get show_user_must_change(): boolean;
    /** `<PasswordResetCard>`, rendered by a ReactHost. */
    get PasswordResetCard(): typeof PasswordResetCard;
    get password_reset_card_props(): {
        user: User;
    };
    /** `<RequirePasswordChangeCard>`, rendered by a ReactHost. */
    get RequirePasswordChangeCard(): typeof RequirePasswordChangeCard;
    /** `<SessionsCard>`, rendered by a ReactHost. */
    get SessionsCard(): import("react").FunctionComponent<Readonly<import("./SessionsCard").SessionsCardProps>>;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type SecurityTabStores = ReturnType<SecurityTab['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<SecurityTabProps>>;
export default _default;
