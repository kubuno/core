import type { ConfirmOptions } from '@ui/ConfirmDialog';
interface ConfirmState extends ConfirmOptions {
    resolve: (ok: boolean) => void;
}
export declare function useConfirm(): {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    confirmState: ConfirmState | null;
    handleConfirm: () => void;
    handleCancel: () => void;
};
export {};
