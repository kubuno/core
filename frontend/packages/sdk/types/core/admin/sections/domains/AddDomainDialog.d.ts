/**
 * Code-behind of `AddDomainDialog.kbview` (converted from `AddDomainDialog.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import { type Domain, type DomainKind } from "./api";
import { ViewBase } from './AddDomainDialog.kbview';
import * as __parts from './AddDomainDialog.parts';
export type AddDomainDialogProps = {
    /** Candidates an alias can hang off: verified, non-alias. */
    domains: Domain[];
    onClose: () => void;
    /** Called with the new domain, so the page can open its verification screen. */
    onAdded: (domain: Domain) => void;
};
export declare class AddDomainDialog extends ViewBase {
    accessor name: string;
    accessor kind: DomainKind;
    accessor parent: string;
    accessor error: string | null;
    tr: AddDomainDialogStores['t'];
    add: AddDomainDialogStores['add'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        add: import("@tanstack/react-query").UseMutationResult<Domain, Error, {
            name: string;
            kind: DomainKind;
            parent_id?: string;
        }, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get parents(): Domain[];
    get enabled_unless_add_is_pending_name(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        name: string;
        setName: (value: AddDomainDialog["name"] | ((prev: AddDomainDialog["name"]) => AddDomainDialog["name"])) => void;
    };
    /** A part of the screen still written in React (<TextField> autoFocus: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (../resources/FieldLabel#default)). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        Choice: ({ value, title, description }: {
            value: DomainKind;
            title: string;
            description: string;
        }) => import("react").JSX.Element;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Choice> is no .kbview element (a local or dynamic component)). */
    get Part3(): typeof __parts.Part3;
    /** A part of the screen still written in React (<Choice> is no .kbview element (a local or dynamic component)). */
    get Part4(): typeof __parts.Part4;
    get show_kind_alias(): boolean;
    get part5_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (../resources/FieldLabel#default)). */
    get Part5(): typeof __parts.Part5;
    get show_parents(): boolean;
    get show_not_parents(): boolean;
    get part6_props(): {
        parent: string;
        t: import("i18next").TFunction<"translation", undefined>;
        parents: Domain[];
        setParent: (value: AddDomainDialog["parent"] | ((prev: AddDomainDialog["parent"]) => AddDomainDialog["parent"])) => void;
    };
    /** A part of the screen still written in React (<Dropdown> width, height, focusable: no .kbview property). */
    get Part6(): typeof __parts.Part6;
    get show_error(): boolean;
    submit(): Promise<void>;
    Choice({ value, title, description }: {
        value: DomainKind;
        title: string;
        description: string;
    }): import("react").JSX.Element;
    panel_mouse_down(_sender: unknown, args: MouseEventArgs): void;
    floating_window_confirm(_sender: unknown, _args: EventArgs): void;
    floating_window_close(_sender: unknown, _args: EventArgs): void;
    /** `setName` of the TSX: a value, or an update of the previous one. */
    setName(value: AddDomainDialog['name'] | ((prev: AddDomainDialog['name']) => AddDomainDialog['name'])): void;
    /** `setParent` of the TSX: a value, or an update of the previous one. */
    setParent(value: AddDomainDialog['parent'] | ((prev: AddDomainDialog['parent']) => AddDomainDialog['parent'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AddDomainDialogStores = ReturnType<AddDomainDialog['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<AddDomainDialogProps>>;
export default _default;
