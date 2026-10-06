import type { SpeechToTextPanel } from './SpeechToTextPanel';
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
export interface GlobalSettings {
    silence_ms: number;
    sound_threshold: number;
    profanity_filter: boolean;
}
declare function GlobalSettingsCard({ settings, disabled, onSave, }: {
    settings: GlobalSettings;
    disabled: boolean;
    onSave: (p: Partial<GlobalSettings>) => void;
}): import("react").JSX.Element;
export { GlobalSettingsCard };
declare function AdvancedOptions({ cfg, onPatch }: {
    cfg: LangCfg;
    onPatch: (p: Partial<LangCfg>) => void;
}): import("react").JSX.Element;
export { AdvancedOptions };
export declare function Part1({ enabled }: {
    enabled: NonNullable<SpeechToTextPanel['enabled']>;
}): import("react").JSX.Element;
export declare function Part2({ enabled, cat, modelsFor, installedSet, expanded, patchLang, t, remove, download, setExpanded }: {
    enabled: NonNullable<SpeechToTextPanel['enabled']>;
    cat: NonNullable<SpeechToTextPanel['cat']>;
    modelsFor: SpeechToTextPanel['modelsFor'];
    installedSet: NonNullable<SpeechToTextPanel['installedSet']>;
    expanded: SpeechToTextPanel['expanded'];
    patchLang: SpeechToTextPanel['patchLang'];
    t: NonNullable<SpeechToTextPanel['tr']>;
    remove: NonNullable<SpeechToTextPanel['remove']>;
    download: NonNullable<SpeechToTextPanel['download']>;
    setExpanded: NonNullable<SpeechToTextPanel['setExpanded']>;
}): import("react").JSX.Element;
