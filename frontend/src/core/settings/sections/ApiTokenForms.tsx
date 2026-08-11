import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Check, Plus, X } from 'lucide-react'
import { Button, Callout, Card, Input } from '@ui'
import { api } from '../../api/client'
import { fallbackCopy } from '../clipboard'
import type { TokenScope } from '../../types'
import { ApiTokenScopePicker } from './ApiTokenScopePicker'

/** Bandeau affiché une seule fois après la création d'un token. */
export function NewTokenBanner({ token, onClose }: { token: string; onClose: () => void }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copy = () => {
    const succeed = () => { setCopied(true); setTimeout(() => setCopied(false), 2000) }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(token).then(succeed).catch(() => fallbackCopy(token, succeed))
    } else {
      fallbackCopy(token, succeed)
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-success bg-success-light p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-success mb-1">
            {t('settings.tok_created')}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <code className="flex-1 block px-3 py-2 bg-white rounded border border-border text-xs font-mono text-text-primary break-all select-all">
              {token}
            </code>
            <button
              onClick={copy}
              title={t('settings.copy')}
              className="shrink-0 flex items-center gap-1 px-3 py-2 rounded border border-border bg-white text-xs text-text-secondary hover:text-text-primary hover:bg-surface-1 transition-colors"
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              {copied ? t('settings.copied') : t('settings.copy')}
            </button>
          </div>
        </div>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary mt-0.5">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

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
export function CreateTokenForm({ onCreated }: { onCreated: (raw: string) => void }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [expiresInDays, setExpiresInDays] = useState<string>('')
  const [scopes, setScopes] = useState<string[]>([])
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['api-token-scopes'],
    queryFn: () =>
      api
        .get<{ scopes: TokenScope[]; max_ttl_days: number }>('/me/api-tokens/scopes')
        .then((r) => r.data),
  })

  const available = useMemo(() => data?.scopes ?? [], [data])
  const maxTtlDays = data?.max_ttl_days ?? 365

  // True as soon as one selected scope changes the instance: the server then
  // refuses a perpetual token, so the field stops being optional.
  const expiryMandatory = useMemo(
    () => available.some((s) => scopes.includes(s.key) && s.requires_expiry),
    [available, scopes]
  )

  const create = useMutation({
    mutationFn: () =>
      api.post<{ token: string; id: string; name: string; scopes: string[]; expires_at: string | null; created_at: string }>(
        '/me/api-tokens',
        {
          name: name.trim(),
          scopes,
          expires_in_days: expiresInDays ? parseInt(expiresInDays, 10) : null,
        }
      ).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] })
      onCreated(data.token)
      setName('')
      setExpiresInDays('')
      setScopes([])
      setError('')
    },
    onError: (err: unknown) => {
      setError((err as { message?: string })?.message ?? t('settings.tok_create_error'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError(t('settings.tok_name_required')); return }
    if (scopes.length === 0) { setError(t('settings.tok_scopes_required')); return }
    if (expiryMandatory && !expiresInDays) {
      setError(t('settings.tok_expiry_required_desc')); return
    }
    create.mutate()
  }

  return (
    <Card
      title={t('settings.tok_new')}
      icon={<Plus size={15} />}
      dense
      className="mb-5"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              label={t('settings.tok_name')}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('settings.tok_name_ph')}
              maxLength={255}
            />
          </div>
          <div className="sm:w-52">
            <Input
              label={t('settings.tok_expires')}
              type="number"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              placeholder={
                expiryMandatory
                  ? t('settings.tok_max_ttl', { days: maxTtlDays })
                  : t('settings.tok_no_expiration')
              }
              min={1}
              max={maxTtlDays}
            />
            <p className="mt-1 text-xs text-text-tertiary">
              {t('settings.tok_max_ttl', { days: maxTtlDays })}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-text-primary mb-1">
            {t('settings.tok_scopes')}
            {scopes.length > 0 && (
              <span className="ml-2 font-normal text-text-tertiary">
                {t('settings.tok_scopes_selected', { count: scopes.length })}
              </span>
            )}
          </p>
          <p className="text-xs text-text-secondary mb-2">{t('settings.tok_scopes_desc')}</p>
          <ApiTokenScopePicker scopes={available} selected={scopes} onChange={setScopes} />
        </div>

        {expiryMandatory && (
          <Callout variant="warning" title={t('settings.tok_expiry_required_title')} t={t}>
            {t('settings.tok_expiry_required_desc')}
          </Callout>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex justify-end">
          <Button type="submit" loading={create.isPending} className="whitespace-nowrap">
            {t('settings.create')}
          </Button>
        </div>
      </form>
    </Card>
  )
}
