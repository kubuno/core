/**
 * Code-behind of `ProfileTab.kbview` (converted from `ProfileTab.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import { type Vis } from "./profileFields";
import { ViewBase } from './ProfileTab.kbview';
import * as __parts from './ProfileTab.parts';
export declare class ProfileTab extends ViewBase {
    accessor saved: boolean;
    accessor busy: boolean;
    tr: ProfileTabStores['t'];
    i18n: ProfileTabStores['i18n'];
    toast: ProfileTabStores['toast'];
    user: ProfileTabStores['user'];
    updateUser: ProfileTabStores['updateUser'];
    f: ProfileTabHooks['f'];
    setF: ProfileTabHooks['setF'];
    vis: ProfileTabHooks['vis'];
    setVis: ProfileTabHooks['setVis'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        toast: import("@ui").ToastApi;
        user: import("../../types").User | null;
        updateUser: (updates: Partial<import("../../types").User>) => void;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        f: {
            fullName: string;
            firstName: string;
            lastName: string;
            namePronunciation: string;
            pronouns: string;
            workLocation: string;
            gender: string;
            birthday: string;
            introduction: string;
            extraEmails: string[];
            phone: string;
            location: string;
            language: string;
            locale: string;
            firstDayOfWeek: string;
            timezone: string;
            website: string;
            x: string;
            bluesky: string;
            fediverse: string;
            organization: string;
            jobFunction: string;
            title: string;
        };
        setF: import("react").Dispatch<import("react").SetStateAction<{
            fullName: string;
            firstName: string;
            lastName: string;
            namePronunciation: string;
            pronouns: string;
            workLocation: string;
            gender: string;
            birthday: string;
            introduction: string;
            extraEmails: string[];
            phone: string;
            location: string;
            language: string;
            locale: string;
            firstDayOfWeek: string;
            timezone: string;
            website: string;
            x: string;
            bluesky: string;
            fediverse: string;
            organization: string;
            jobFunction: string;
            title: string;
        }>>;
        vis: Record<string, Vis>;
        setVis: import("react").Dispatch<import("react").SetStateAction<Record<string, Vis>>>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get prefs(): Record<string, unknown>;
    get prof(): Record<string, unknown>;
    get storedVis(): Record<string, Vis>;
    get tz(): string[];
    get localePreview(): string;
    get weekStartLabel(): string;
    get labelSelect(): import("react").JSX.Element;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        vis: Record<string, Vis>;
        setV: (k: string) => (v: Vis) => void;
        f: {
            fullName: string;
            firstName: string;
            lastName: string;
            namePronunciation: string;
            pronouns: string;
            workLocation: string;
            gender: string;
            birthday: string;
            introduction: string;
            extraEmails: string[];
            phone: string;
            location: string;
            language: string;
            locale: string;
            firstDayOfWeek: string;
            timezone: string;
            website: string;
            x: string;
            bluesky: string;
            fediverse: string;
            organization: string;
            jobFunction: string;
            title: string;
        };
        set: <K extends keyof ProfileTab["f"]>(k: K, v: ProfileTab["f"][K]) => void;
        user: import("../../types").User | null;
    };
    /** A part of the screen still written in React (<Section> is no .kbview element (./profileFields#Section)). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        vis: Record<string, Vis>;
        setV: (k: string) => (v: Vis) => void;
        f: {
            fullName: string;
            firstName: string;
            lastName: string;
            namePronunciation: string;
            pronouns: string;
            workLocation: string;
            gender: string;
            birthday: string;
            introduction: string;
            extraEmails: string[];
            phone: string;
            location: string;
            language: string;
            locale: string;
            firstDayOfWeek: string;
            timezone: string;
            website: string;
            x: string;
            bluesky: string;
            fediverse: string;
            organization: string;
            jobFunction: string;
            title: string;
        };
        set: <K extends keyof ProfileTab["f"]>(k: K, v: ProfileTab["f"][K]) => void;
    };
    /** A part of the screen still written in React (<Section> is no .kbview element (./profileFields#Section)). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        labelSelect: import("react").JSX.Element;
        localePreview: string;
        weekStartLabel: string;
        f: {
            fullName: string;
            firstName: string;
            lastName: string;
            namePronunciation: string;
            pronouns: string;
            workLocation: string;
            gender: string;
            birthday: string;
            introduction: string;
            extraEmails: string[];
            phone: string;
            location: string;
            language: string;
            locale: string;
            firstDayOfWeek: string;
            timezone: string;
            website: string;
            x: string;
            bluesky: string;
            fediverse: string;
            organization: string;
            jobFunction: string;
            title: string;
        };
        set: <K extends keyof ProfileTab["f"]>(k: K, v: ProfileTab["f"][K]) => void;
        tz: string[];
    };
    /** A part of the screen still written in React (<Section> is no .kbview element (./profileFields#Section)). */
    get Part3(): typeof __parts.Part3;
    /** A part of the screen still written in React (<Section> is no .kbview element (./profileFields#Section)). */
    get Part4(): typeof __parts.Part4;
    get button_text(): string;
    s(v: unknown): string;
    set<K extends keyof ProfileTab['f']>(k: K, v: (ProfileTab['f'])[K]): void;
    setV(k: string): (v: Vis) => void;
    handleSubmit(e: React.FormEvent): Promise<void>;
    panel_submit(_sender: unknown, args: EventArgs): Promise<void>;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ProfileTabStores = ReturnType<ProfileTab['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ProfileTabHooks = ReturnType<ProfileTab['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
