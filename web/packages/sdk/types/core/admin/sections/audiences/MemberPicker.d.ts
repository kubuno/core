/**
 * Code-behind of `MemberPicker.kbview` (converted from `MemberPicker.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import type { AudienceMember } from "./api";
import { ViewBase } from './MemberPicker.kbview';
import * as __parts from './MemberPicker.parts';
interface Candidate {
    member_type: 'user' | 'group';
    member_id: string;
    label: string;
    sub: string | null;
    /** Active accounts a group brings in. Null for an individual account. */
    reach: number | null;
}
export type MemberPickerProps = {
    already: AudienceMember[];
    busy: boolean;
    error?: string;
    onAdd: (members: {
        member_type: string;
        member_id: string;
    }[]) => void;
    onCancel: () => void;
};
export declare class MemberPicker extends ViewBase {
    accessor q: string;
    accessor picked: Record<string, Candidate>;
    tr: MemberPickerStores['t'];
    groups: MemberPickerStores['groups'];
    users: MemberPickerStores['users'];
    shown: Candidate[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        groups: import("@tanstack/react-query").UseQueryResult<NoInfer<{
            id: string;
            name: string;
            member_count: number;
        }[]>, Error>;
        users: import("@tanstack/react-query").UseQueryResult<NoInfer<{
            id: string;
            email: string;
            display_name: string | null;
            username: string;
            is_active: boolean;
        }[]>, Error>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        taken: Set<string>;
        candidates: Candidate[];
        shown: Candidate[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get chosen(): Candidate[];
    get addedReach(): number;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        onCancel: () => void;
        chosen: Candidate[];
        addedReach: number;
        onAdd: (members: {
            member_type: string;
            member_id: string;
        }[]) => void;
        busy: boolean;
        q: string;
        setQ: (value: MemberPicker["q"] | ((prev: MemberPicker["q"]) => MemberPicker["q"])) => void;
        shown: Candidate[];
        picked: Record<string, Candidate>;
        toggle: (c: Candidate) => void;
        error: string | undefined;
    };
    /** A part of the screen still written in React (<FloatingWindow> actions.extra: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    toggle(c: Candidate): void;
    panel_mouse_down(_sender: unknown, args: MouseEventArgs): void;
    /** `setQ` of the TSX: a value, or an update of the previous one. */
    setQ(value: MemberPicker['q'] | ((prev: MemberPicker['q']) => MemberPicker['q'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type MemberPickerStores = ReturnType<MemberPicker['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type MemberPickerHooks = ReturnType<MemberPicker['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<MemberPickerProps>>;
export default _default;
