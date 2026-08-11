/**
 * "Reset the password" — the administrator's way back in for a locked-out user.
 *
 * ## For whoever wires this into the user list or the user detail card
 *
 * ```tsx
 * const [resetting, setResetting] = useState<AdminUser | null>(null)
 * …
 * {resetting && (
 *   <ResetPasswordDialog
 *     userId={resetting.id}
 *     userLabel={resetting.display_name || resetting.username}
 *     userEmail={resetting.email}
 *     onClose={() => setResetting(null)}
 *     onDone={() => qc.invalidateQueries({ queryKey: ['admin', 'users'] })}
 *   />
 * )}
 * ```
 *
 * It owns its own request and its own two-step flow (form → outcome); the
 * caller only decides when it is mounted. `onDone` fires once the reset
 * succeeded, so a list showing `must_change_password` or a session count can
 * refresh — it is NOT a close signal.
 *
 * ## Why the generated password is shown here
 *
 * Only the server-generated one, and only once: the operator has no other copy
 * to hand over. A password the operator typed themselves is never echoed back —
 * they already have it, and displaying it again would only put it in one more
 * place.
 */
export interface ResetPasswordDialogProps {
    userId: string;
    /** Display name or username — shown in the dialog subtitle. */
    userLabel: string;
    /** Account address, used as the placeholder of the "send to" field. */
    userEmail?: string;
    onClose: () => void;
    /** Called after a successful reset, for the caller to refresh its data. */
    onDone?: () => void;
}
export default function ResetPasswordDialog({ userId, userLabel, userEmail, onClose, onDone, }: ResetPasswordDialogProps): import("react").JSX.Element;
