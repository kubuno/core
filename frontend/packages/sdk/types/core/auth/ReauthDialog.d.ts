interface Props {
    /** Called with the fresh proof; the API client replays the request with it. */
    onProof: (token: string) => void;
    onCancel: () => void;
}
/**
 * Asks the operator to prove presence again before a sensitive action.
 *
 * Which proof is accepted is decided by the SERVER (`/auth/reauth/challenge`) and
 * merely rendered here: when the account carries a second factor the password is
 * not offered at all, because a stolen password is precisely the scenario the
 * second factor answers.
 */
export declare function ReauthDialog({ onProof, onCancel }: Props): import("react").JSX.Element;
export {};
