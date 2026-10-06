import type { PromptOptions } from '@ui/PromptDialog';
interface PromptState extends PromptOptions {
    resolve: (value: string | null) => void;
}
export declare function usePrompt(): {
    prompt: (options: PromptOptions) => Promise<string | null>;
    promptState: PromptState | null;
    handleConfirm: (value: string) => void;
    handleCancel: () => void;
};
export {};
