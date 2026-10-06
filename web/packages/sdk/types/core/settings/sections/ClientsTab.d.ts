/**
 * Code-behind of `ClientsTab.kbview` (converted from `ClientsTab.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { useNavigate } from 'react-router-dom';
import { ViewBase } from './ClientsTab.kbview';
import * as __parts from './ClientsTab.parts';
export declare class ClientsTab extends ViewBase {
    accessor copied: boolean;
    tr: ClientsTabStores['t'];
    activeModules: ClientsTabStores['activeModules'];
    navigate: ReturnType<typeof useNavigate>;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        activeModules: import("../../types").ActiveModule[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get activeIds(): Set<string>;
    get serverUrl(): string;
    get connectors(): {
        id: string;
        to: string;
        Icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
        label: string;
    }[];
    /** `<StoreBadge>`, rendered by a ReactHost. */
    get StoreBadge(): typeof __parts.StoreBadge;
    get store_badge_props(): {
        href: string;
        Icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
        top: string;
        bottom: string;
        sub: string;
    };
    get store_badge_props2(): {
        href: string;
        Icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
        top: string;
        bottom: string;
    };
    get store_badge_props3(): {
        href: string;
        Icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
        top: string;
        bottom: string;
    };
    get store_badge_props4(): {
        href: string;
        Icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
        top: string;
        bottom: string;
    };
    get show_connectors(): boolean;
    /** The rows of the Repeater over `connectors`. */
    get rows_connectors(): {
        c: {
            id: string;
            to: string;
            Icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
            label: string;
        };
        icon: string | undefined;
        text: string | undefined;
        key: string;
    }[];
    get show_not_copied(): boolean;
    copy(): void;
    link_label_click(_sender: unknown, _args: MouseEventArgs): void;
    panel_click(_sender: unknown, args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ClientsTabStores = ReturnType<ClientsTab['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
