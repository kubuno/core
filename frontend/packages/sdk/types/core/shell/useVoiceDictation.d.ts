import { type ReactNode } from 'react';
export interface UseVoiceDictationOptions {
    /** Recognition language; defaults to the UI language. */
    lang?: string;
    /** Called live with the full editable text (finalized + interim + manual edits). */
    onText?: (text: string) => void;
    /** Optional seed text to start the toast with (caret placed at its end). */
    getSeed?: () => string;
    /** Called when the user validates (Enter / ✓): receives the final text, toast closes. */
    onSubmit?: (text: string) => void;
}
export interface VoiceDictation {
    enabled: boolean;
    listening: boolean;
    voiceLoading: boolean;
    voiceError: string | null;
    micBtnRef: React.RefObject<HTMLButtonElement | null>;
    toggleVoice: () => void;
    stop: () => void;
    /** The centered toast overlay — render it anywhere (it is `position: fixed`). */
    voiceToast: ReactNode;
}
export declare function useVoiceDictation(opts?: UseVoiceDictationOptions): VoiceDictation;
