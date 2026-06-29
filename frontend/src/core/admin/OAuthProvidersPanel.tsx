import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Plus, Trash2, Edit2, KeyRound, Copy, Check, ShieldCheck, Power } from 'lucide-react'
import { Button, Input } from '@ui'
import { useConfirm } from '../hooks/useConfirm'
import ConfirmDialog from '@ui/ConfirmDialog'

interface AdminProvider {
  id:           string
  slug:         string
  display_name: string
  issuer_url:   string
  client_id:    string
  has_secret:   boolean
  scopes:       string
  button_color: string | null
  enabled:      boolean
  allow_signup: boolean
  position:     number
}

// Quick presets: prefill the form for common identity providers. The admin still
// supplies the host/realm, client id and secret.
const PRESETS: { key: string; label: string; display: string; issuerHint: string; scopes: string }[] = [
  { key: 'keycloak', label: 'Keycloak', display: 'Keycloak', issuerHint: 'https://auth.exemple.com/realms/mon-realm', scopes: 'openid email profile' },
  { key: 'gitlab',   label: 'GitLab',   display: 'GitLab',   issuerHint: 'https://gitlab.com',                         scopes: 'openid email profile' },
  { key: 'authentik',label: 'Authentik',display: 'Authentik',issuerHint: 'https://auth.exemple.com/application/o/<app>/', scopes: 'openid email profile' },
  { key: 'generic',  label: 'Autre (OIDC)', display: '',     issuerHint: 'https://idp.exemple.com',                   scopes: 'openid email profile' },
]

interface FormState {
  slug:          string
  display_name:  string
  issuer_url:    string
  client_id:     string
  client_secret: string
  scopes:        string
  button_color:  string
  enabled:       boolean
  allow_signup:  boolean
}

const emptyForm: FormState = {
  slug: '', display_name: '', issuer_url: '', client_id: '', client_secret: '',
  scopes: 'openid email profile', button_color: '', enabled: true, allow_signup: true,
}

function ProviderForm({
  initial,
  isEdit,
  onSave,
  onCancel,
}: {
  initial: FormState
  isEdit: boolean
  onSave: (data: FormState) => void
  onCancel: () => void
}) {
  const [f, setF] = useState<FormState>(initial)
  const [copied, setCopied] = useState(false)
  const set = (k: keyof FormState, v: string | boolean) => setF((p) => ({ ...p, [k]: v }))

  const redirectUri = f.slug
    ? `${window.location.origin}/api/v1/auth/oauth/${f.slug}/callback`
    : `${window.location.origin}/api/v1/auth/oauth/<slug>/callback`

  const copyRedirect = () => {
    navigator.clipboard?.writeText(redirectUri).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500)
    })
  }

  const canSave = f.slug.trim() && f.display_name.trim() && f.issuer_url.trim() && f.client_id.trim()

  return (
    <div className="border border-border rounded-xl p-4 bg-surface-1 space-y-4">
      {!isEdit && (
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setF((prev) => ({
                ...prev,
                slug: prev.slug || p.key === 'generic' ? prev.slug : p.key,
                display_name: prev.display_name || p.display,
                scopes: p.scopes,
              }))}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-border hover:bg-surface-2 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="text-text-secondary">Identifiant (slug, dans l'URL)</span>
          <Input value={f.slug} disabled={isEdit}
            onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="keycloak" />
        </label>
        <label className="text-sm">
          <span className="text-text-secondary">Nom affiché (bouton)</span>
          <Input value={f.display_name} onChange={(e) => set('display_name', e.target.value)} placeholder="Keycloak" />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="text-text-secondary">Issuer URL (OIDC discovery)</span>
          <Input value={f.issuer_url} onChange={(e) => set('issuer_url', e.target.value)}
            placeholder="https://auth.exemple.com/realms/mon-realm" />
        </label>
        <label className="text-sm">
          <span className="text-text-secondary">Client ID</span>
          <Input value={f.client_id} onChange={(e) => set('client_id', e.target.value)} placeholder="kubuno" />
        </label>
        <label className="text-sm">
          <span className="text-text-secondary">
            Client secret {isEdit && <span className="text-text-tertiary">(laisser vide = inchangé)</span>}
          </span>
          <Input type="password" value={f.client_secret} onChange={(e) => set('client_secret', e.target.value)}
            placeholder={isEdit ? '••••••••' : 'secret (vide si client public)'} autoComplete="new-password" />
        </label>
        <label className="text-sm">
          <span className="text-text-secondary">Scopes</span>
          <Input value={f.scopes} onChange={(e) => set('scopes', e.target.value)} placeholder="openid email profile" />
        </label>
        <label className="text-sm">
          <span className="text-text-secondary">Couleur du bouton (hex, optionnel)</span>
          <Input value={f.button_color} onChange={(e) => set('button_color', e.target.value)} placeholder="#4d9de0" />
        </label>
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={f.enabled} onChange={(e) => set('enabled', e.target.checked)} />
          Activé (visible sur la page de connexion)
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={f.allow_signup} onChange={(e) => set('allow_signup', e.target.checked)} />
          Autoriser la création de comptes
        </label>
      </div>

      {/* Redirect URI to register in the IdP */}
      <div className="rounded-lg bg-surface-2 p-3 text-sm">
        <div className="text-text-secondary mb-1">URL de redirection à déclarer dans le fournisseur :</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs break-all text-text-primary">{redirectUri}</code>
          <button onClick={copyRedirect} className="p-1.5 rounded hover:bg-surface-3 text-text-secondary" title="Copier">
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button disabled={!canSave} onClick={() => onSave(f)}>{isEdit ? 'Enregistrer' : 'Ajouter'}</Button>
      </div>
    </div>
  )
}

export default function OAuthProvidersPanel() {
  const qc = useQueryClient()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
  const [editing, setEditing] = useState<string | null>(null)  // provider id, or 'new'

  const { data: providers, isLoading } = useQuery({
    queryKey: ['admin', 'oauth-providers'],
    queryFn: () => api.get<{ providers: AdminProvider[] }>('/admin/oauth-providers').then((r) => r.data.providers),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'oauth-providers'] })
    qc.invalidateQueries({ queryKey: ['oauth-providers'] })  // public list on the login page
  }

  const createM = useMutation({
    mutationFn: (data: FormState) => api.post('/admin/oauth-providers', data),
    onSuccess: () => { invalidate(); setEditing(null) },
  })
  const updateM = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormState> }) =>
      api.patch(`/admin/oauth-providers/${id}`, data),
    onSuccess: () => { invalidate(); setEditing(null) },
  })
  const deleteM = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/oauth-providers/${id}`),
    onSuccess: invalidate,
  })

  const toFormState = (p: AdminProvider): FormState => ({
    slug: p.slug, display_name: p.display_name, issuer_url: p.issuer_url, client_id: p.client_id,
    client_secret: '', scopes: p.scopes, button_color: p.button_color ?? '',
    enabled: p.enabled, allow_signup: p.allow_signup,
  })

  const submit = (data: FormState) => {
    if (editing === 'new') {
      createM.mutate(data)
    } else if (editing) {
      // Omit the secret when left blank so the stored one is kept.
      const payload: Partial<FormState> = { ...data }
      if (!data.client_secret) delete payload.client_secret
      updateM.mutate({ id: editing, data: payload })
    }
  }

  const onDelete = async (p: AdminProvider) => {
    const ok = await confirm({
      title: 'Supprimer le fournisseur',
      message: `Supprimer « ${p.display_name} » ? Les utilisateurs liés conservent leur compte mais ne pourront plus se connecter via ce fournisseur.`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
    })
    if (ok) deleteM.mutate(p.id)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium flex items-center gap-2">
            <ShieldCheck size={20} className="text-primary" /> Fournisseurs SSO (OIDC)
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Connectez Keycloak, GitLab ou tout fournisseur OpenID Connect. La découverte des points
            d'accès est automatique (<code>.well-known/openid-configuration</code>).
          </p>
        </div>
        {editing === null && (
          <Button onClick={() => setEditing('new')}><Plus size={16} className="mr-1" /> Ajouter</Button>
        )}
      </div>

      {editing === 'new' && (
        <div className="mb-4">
          <ProviderForm initial={emptyForm} isEdit={false} onSave={submit} onCancel={() => setEditing(null)} />
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-text-tertiary">Chargement…</div>
      ) : (providers?.length ?? 0) === 0 && editing !== 'new' ? (
        <div className="text-sm text-text-tertiary border border-dashed border-border rounded-xl p-8 text-center">
          Aucun fournisseur configuré. Cliquez sur « Ajouter » pour en créer un.
        </div>
      ) : (
        <div className="space-y-2">
          {providers?.map((p) => (
            editing === p.id ? (
              <ProviderForm key={p.id} initial={toFormState(p)} isEdit onSave={submit} onCancel={() => setEditing(null)} />
            ) : (
              <div key={p.id} className="flex items-center gap-3 border border-border rounded-xl p-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: (p.button_color || '#4d9de0') + '22', color: p.button_color || '#4d9de0' }}
                >
                  <KeyRound size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{p.display_name}</span>
                    <span className="text-xs font-mono text-text-tertiary">/{p.slug}</span>
                    {!p.enabled && <span className="text-xs px-1.5 py-0.5 rounded bg-surface-3 text-text-tertiary">désactivé</span>}
                  </div>
                  <div className="text-xs text-text-tertiary truncate">{p.issuer_url}</div>
                </div>
                <button
                  onClick={() => updateM.mutate({ id: p.id, data: { enabled: !p.enabled } })}
                  title={p.enabled ? 'Désactiver' : 'Activer'}
                  className={`p-2 rounded-lg hover:bg-surface-2 ${p.enabled ? 'text-success' : 'text-text-tertiary'}`}
                >
                  <Power size={16} />
                </button>
                <button onClick={() => setEditing(p.id)} title="Modifier" className="p-2 rounded-lg hover:bg-surface-2 text-text-secondary">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => onDelete(p)} title="Supprimer" className="p-2 rounded-lg hover:bg-danger-light text-danger">
                  <Trash2 size={16} />
                </button>
              </div>
            )
          ))}
        </div>
      )}

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
