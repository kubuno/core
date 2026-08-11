/** Bandeau affiché une seule fois après la création d'un token. */
export declare function NewTokenBanner({ token, onClose }: {
    token: string;
    onClose: () => void;
}): import("react").JSX.Element;
/**
 * Formulaire de création d'un nouveau token.
 *
 * The scope list is mandatory and comes from the server, restricted to what the
 * account holds right now. Two rules are mirrored here so the operator learns
 * them before the request rather than from a refusal:
 *
 *  * picking a scope that changes the instance makes the expiry field mandatory;
 *  * whatever is asked for is clamped to the instance ceiling.
 *
 * The server enforces both again — this is a courtesy, not the guarantee.
 */
export declare function CreateTokenForm({ onCreated }: {
    onCreated: (raw: string) => void;
}): import("react").JSX.Element;
