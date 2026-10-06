import type { OAuthProvidersPanel } from './OAuthProvidersPanel';
export interface FormState {
    slug: string;
    display_name: string;
    issuer_url: string;
    client_id: string;
    client_secret: string;
    scopes: string;
    button_color: string;
    enabled: boolean;
    allow_signup: boolean;
    claim_username: string;
    claim_email: string;
    claim_display_name: string;
    claim_groups: string;
    sync_groups: boolean;
}
declare function ProviderForm({ initial, isEdit, onSave, onCancel, }: {
    initial: FormState;
    isEdit: boolean;
    onSave: (data: FormState) => void;
    onCancel: () => void;
}): import("react").JSX.Element;
export { ProviderForm };
export declare function Part1({ setEditing }: {
    setEditing: NonNullable<OAuthProvidersPanel['setEditing']>;
}): import("react").JSX.Element;
export declare function Part2({ providers, editing, toFormState, submit, setEditing, testM, updateM, onDelete }: {
    providers: OAuthProvidersPanel['providers'];
    editing: OAuthProvidersPanel['editing'];
    toFormState: OAuthProvidersPanel['toFormState'];
    submit: OAuthProvidersPanel['submit'];
    setEditing: NonNullable<OAuthProvidersPanel['setEditing']>;
    testM: NonNullable<OAuthProvidersPanel['testM']>;
    updateM: NonNullable<OAuthProvidersPanel['updateM']>;
    onDelete: OAuthProvidersPanel['onDelete'];
}): import("react").JSX.Element;
export declare function Part3({ p, r, r_authorization_endpoint, r_detail, r_hint }: {
    p: NonNullable<OAuthProvidersPanel['rows_items']>[number]['p'];
    r: NonNullable<OAuthProvidersPanel['rows_items']>[number]['r'];
    r_authorization_endpoint: string;
    r_detail: string;
    r_hint: string;
}): import("react").JSX.Element;
