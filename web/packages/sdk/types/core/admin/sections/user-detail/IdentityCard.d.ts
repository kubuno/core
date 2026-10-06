import type { OrgUnit, User } from "../../../types";
import { UserAvatar } from "./UserAvatar";
import { ViewBase } from './IdentityCard.kbview';
import * as __parts from './IdentityCard.parts';
interface Props {
    user: User;
    /** Sticky on a wide screen; stacked above the tabs on a narrow one. */
    mobile: boolean;
    busy: boolean;
    onToggleActive: () => void;
    /** Opens one of the sheet's tabs — the actions that already have a card there
     *  send the operator to it rather than growing a second way to do the job. */
    goPane: (pane: 'profile' | 'security') => void;
}
export type { Props };
export declare class IdentityCard extends ViewBase {
    tr: IdentityCardStores['t'];
    can: IdentityCardStores['can'];
    me: User | null;
    units: IdentityCardStores['units'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../../../authz/types").CanFn;
        me: User | null;
        units: NoInfer<OrgUnit[]> | undefined;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get isSelf(): boolean;
    get unitName(): string | undefined;
    get aside_class(): string;
    /** `<RoleBadge>`, rendered by a ReactHost. */
    get RoleBadge(): import("react").FunctionComponent<Readonly<import("./RoleBadge").RoleBadgeProps>>;
    get role_badge_props(): {
        role: "user" | "admin" | "guest";
        label: string;
    };
    /** `<UserAvatar>`, rendered by a ReactHost. */
    get UserAvatar(): typeof UserAvatar;
    get user_avatar_props(): {
        user: User;
        size: number;
    };
    get h1_text(): string;
    /** `<StatusBadge>`, rendered by a ReactHost. */
    get StatusBadge(): import("react").FunctionComponent<Readonly<import("./StatusBadge").StatusBadgeProps>>;
    get status_badge_props(): {
        active: boolean;
        label: string;
    };
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_meta_t_admin(): {
        children: import("react").JSX.Element;
    };
    get content_meta_t_admin2(): {
        children: import("react").JSX.Element;
    };
    get show_unit_name(): boolean;
    get show_can_priv_user(): boolean;
    /** `<Action>`, rendered by a ReactHost. */
    get Action(): typeof __parts.Action;
    get action_props(): {
        icon: React.ReactNode;
        label: string;
        onClick: () => void;
        danger?: boolean;
        disabled?: boolean;
        reason?: string;
    };
    get show_can_priv_org(): boolean;
    /** `<Action>`, rendered by a ReactHost. */
    get Action2(): typeof __parts.Action;
    get action_props2(): {
        icon: React.ReactNode;
        label: string;
        onClick: () => void;
        danger?: boolean;
        disabled?: boolean;
        reason?: string;
    };
    get show_can_priv_users(): boolean;
    /** `<Action>`, rendered by a ReactHost. */
    get Action3(): typeof __parts.Action;
    get action_props3(): {
        icon: import("react").JSX.Element;
        label: string;
        danger: boolean;
        onClick: () => void;
        disabled: boolean;
        reason: string | undefined;
    };
    meta(label: string, value: string): import("react").JSX.Element;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type IdentityCardStores = ReturnType<IdentityCard['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<Props>>;
export default _default;
