import type { ReactNode } from "react";
import { type SettingItem } from "./moduleSettingSchema";
import { ViewBase } from './ModuleSettingRow.kbview';
export interface ModuleSettingRowProps {
    item: SettingItem;
    value: unknown;
    /** Differs from the factory default. */
    modified: boolean;
    /** Edited in this session and not saved yet. */
    pending: boolean;
    invalid: boolean;
    /** A level above pinned this value, or the caller may not write here. */
    readOnly?: boolean;
    /**
     * Offer "back to the factory value".
     *
     * False on a unit, where it would be a trap: staging the factory value there
     * and saving does not clear the unit's row, it WRITES the factory value into
     * it — the unit stops following its parent while looking as if it had been
     * put back. On a unit the honest action is "hériter", which the panel renders
     * under the provenance sentence instead.
     */
    showFactoryReset?: boolean;
    /**
     * The at-a-glance state of the value beside the label — inherited, overridden
     * here, locked. Passed in rather than derived: the row knows the module's
     * declaration, only the panel knows which scope is on screen.
     */
    statusPill?: ReactNode;
    /** The provenance sentence under the control, with its revert/lock actions. */
    provenance?: ReactNode;
    onChange: (v: unknown) => void;
    onReset: () => void;
}
export declare class ModuleSettingRow extends ViewBase {
    tr: ModuleSettingRowStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get readOnly(): boolean;
    get showFactoryReset(): boolean;
    get inline(): boolean;
    get caption(): import("react").JSX.Element;
    get trailer(): import("react").JSX.Element;
    get control(): import("react").JSX.Element;
    get div_class(): string;
    get show_not_inline(): boolean;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_control(): {
        children: import("react").JSX.Element;
    };
    get content_caption(): {
        children: import("react").JSX.Element;
    };
    get content_trailer(): {
        children: import("react").JSX.Element;
    };
    get content_caption2(): {
        children: import("react").JSX.Element;
    };
    get content_control2(): {
        children: import("react").JSX.Element;
    };
    get content_trailer2(): {
        children: import("react").JSX.Element;
    };
    describeDefault(): string;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ModuleSettingRowStores = ReturnType<ModuleSettingRow['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<ModuleSettingRowProps>>;
export default _default;
