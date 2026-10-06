export type VoiceErrorCode = 'not-allowed' | 'audio-capture' | 'connect' | 'generic';
export interface VoiceCallbacks {
    onReady?: () => void;
    onLevel?: (level: number) => void;
    onPartial?: (text: string) => void;
    onResult?: (text: string) => void;
    onError?: (code: VoiceErrorCode) => void;
}
export interface VoiceSession {
    stop: () => void;
}
export declare function startVoiceSession(lang: string, cb: VoiceCallbacks): Promise<VoiceSession>;
