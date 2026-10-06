/**
 * Code-behind of `SpeechToTextPanel.kbview` (converted from `SpeechToTextPanel.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import { ViewBase } from './SpeechToTextPanel.kbview';
import * as __parts from './SpeechToTextPanel.parts';
interface VoskModel {
    id: string;
    lang: string;
    label: string;
    size_mb: number;
    url: string;
}
interface WhisperModel {
    id: string;
    label: string;
    size_mb: number;
    url: string;
}
interface LangCfg {
    engine: string;
    model: string;
    enabled: boolean;
    initial_prompt: string;
    grammar: string;
    normalize_numbers: boolean;
    punctuation: boolean;
    translate: boolean;
    beam_size: number;
    auto_detect: boolean;
}
interface GlobalSettings {
    silence_ms: number;
    sound_threshold: number;
    profanity_filter: boolean;
}
interface DownloadStatus {
    state: string;
    received: number;
    total: number;
    error?: string | null;
}
interface Catalog {
    enabled: boolean;
    settings: GlobalSettings;
    config: Record<string, Partial<LangCfg>>;
    downloads: Record<string, DownloadStatus>;
    installed: {
        vosk: string[];
        whisper: string[];
    };
    languages: {
        code: string;
        label: string;
    }[];
    vosk: VoskModel[];
    whisper: WhisperModel[];
}
export declare class SpeechToTextPanel extends ViewBase {
    accessor expanded: string | null;
    tr: SpeechToTextPanelStores['t'];
    qc: SpeechToTextPanelStores['qc'];
    cat: SpeechToTextPanelStores['cat'];
    isLoading: boolean;
    isError: boolean;
    setConfig: SpeechToTextPanelHooks['setConfig'];
    download: SpeechToTextPanelStores['download'];
    remove: SpeechToTextPanelStores['remove'];
    setEnabled: SpeechToTextPanelHooks['setEnabled'];
    setSettings: SpeechToTextPanelHooks['setSettings'];
    installedSet: Set<string>;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        qc: import("@tanstack/query-core").QueryClient;
        cat: NoInfer<Catalog> | undefined;
        isLoading: boolean;
        isError: boolean;
        download: import("@tanstack/react-query").UseMutationResult<any, Error, {
            engine: string;
            model: string;
        }, unknown>;
        remove: import("@tanstack/react-query").UseMutationResult<any, Error, {
            engine: string;
            model: string;
        }, unknown>;
        installedSet: Set<string>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        setConfig: import("@tanstack/react-query").UseMutationResult<any, Error, {
            lang: string;
        } & Partial<LangCfg>, unknown>;
        setEnabled: import("@tanstack/react-query").UseMutationResult<any, Error, boolean, {
            prev: Catalog | undefined;
        }>;
        setSettings: import("@tanstack/react-query").UseMutationResult<any, Error, Partial<GlobalSettings>, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get enabled(): boolean;
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_main(): boolean;
    get part1_props(): {
        enabled: boolean;
    };
    /** A part of the screen still written in React (<span> with a computed style). */
    get Part1(): typeof __parts.Part1;
    get p_text(): string;
    get enabled_unless_set_enabled_is_pending(): boolean;
    /** `<GlobalSettingsCard>`, rendered by a ReactHost. */
    get GlobalSettingsCard(): typeof __parts.GlobalSettingsCard;
    get global_settings_card_props(): {
        settings: __parts.GlobalSettings;
        disabled: boolean;
        onSave: (p: Partial<__parts.GlobalSettings>) => void;
    };
    get part2_props(): {
        enabled: boolean;
        cat: NoInfer<Catalog>;
        modelsFor: (engine: string, lang: string) => {
            id: string;
            label: string;
            size_mb: number;
        }[];
        installedSet: Set<string>;
        expanded: string | null;
        patchLang: (lang: string, patch: Partial<LangCfg>) => void;
        t: import("i18next").TFunction<"translation", undefined>;
        remove: import("@tanstack/react-query").UseMutationResult<any, Error, {
            engine: string;
            model: string;
        }, unknown>;
        download: import("@tanstack/react-query").UseMutationResult<any, Error, {
            engine: string;
            model: string;
        }, unknown>;
        setExpanded: (value: string | null | ((prev: string | null) => string | null)) => void;
    };
    /** A part of the screen still written in React (<div aria-disabled>: attribute(s) without a .kbview property). */
    get Part2(): typeof __parts.Part2;
    invalidateAll(): void;
    patchLang(lang: string, patch: Partial<LangCfg>): void;
    modelsFor(engine: string, lang: string): {
        id: string;
        label: string;
        size_mb: number;
    }[];
    switch_checked_changed(_sender: unknown, args: EventArgs): undefined;
    /** `setExpanded` of the TSX: a value, or an update of the previous one. */
    setExpanded(value: string | null | ((prev: string | null) => string | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type SpeechToTextPanelStores = ReturnType<SpeechToTextPanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type SpeechToTextPanelHooks = ReturnType<SpeechToTextPanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
