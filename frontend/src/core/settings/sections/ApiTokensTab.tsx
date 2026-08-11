import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow, format } from 'date-fns'
import { Key, Trash2 } from 'lucide-react'
import { Badge, Callout, EmptyState } from '@ui'
import { api } from '../../api/client'
import { getDateLocale } from '../../i18n/dateLocale'
import type { ApiToken } from '../../types'
import { NewTokenBanner, CreateTokenForm } from './ApiTokenForms'
import { TokenScopeList } from './ApiTokenScopePicker'

export function ApiTokensTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [newToken, setNewToken] = useState<string | null>(null)

  const { data: tokens, isLoading } = useQuery({
    queryKey: ['api-tokens'],
    queryFn: () =>
      api.get<{ tokens: ApiToken[] }>('/me/api-tokens').then((r) => r.data.tokens),
  })

  const revoke = useMutation({
    mutationFn: (id: string) => api.delete(`/me/api-tokens/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-tokens'] }),
  })

  // One banner for the lot rather than one per row: the operator's task is
  // "reissue these before the deadline", and that is a single decision.
  const legacy = useMemo(() => (tokens ?? []).filter((tok) => tok.is_legacy), [tokens])
  const soonest = useMemo(() => {
    const dates = legacy
      .map((tok) => tok.legacy_grace_until)
      .filter((d): d is string => Boolean(d))
      .sort()
    return dates[0] ?? null
  }, [legacy])

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <h3 className="text-sm font-medium text-text-primary">{t('settings.tok_title')}</h3>
        <p className="text-xs text-text-secondary mt-1">
          {t('settings.tok_desc')}
        </p>
      </div>

      {newToken && (
        <NewTokenBanner token={newToken} onClose={() => setNewToken(null)} />
      )}

      {legacy.length > 0 && (
        <div className="mb-5">
          <Callout variant="warning" title={t('settings.tok_legacy_title')} t={t}>
            <p>{t('settings.tok_legacy_desc')}</p>
            {soonest && (
              <p className="mt-1 font-medium">
                {t('settings.tok_legacy_until', {
                  date: format(new Date(soonest), 'd MMMM yyyy', { locale: getDateLocale() }),
                })}
              </p>
            )}
          </Callout>
        </div>
      )}

      <CreateTokenForm onCreated={setNewToken} />

      {isLoading && (
        <p className="text-sm text-text-secondary py-4">{t('common.loading')}</p>
      )}

      {tokens && tokens.length === 0 && (
        <EmptyState
          icon={<Key size={26} />}
          title={t('settings.tok_none')}
          variant="first-use"
          compact
          t={t}
        />
      )}

      {tokens && tokens.length > 0 && (
        <div className="space-y-2">
          {tokens.map((tok) => {
            const isExpired = tok.expires_at ? new Date(tok.expires_at) < new Date() : false
            const graceOver =
              tok.is_legacy && tok.legacy_grace_until
                ? new Date(tok.legacy_grace_until) < new Date()
                : false
            return (
              <div
                key={tok.id}
                className={`px-4 py-3 rounded-lg border bg-white
                  ${isExpired || graceOver ? 'border-warning-light opacity-60' : 'border-border'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Key
                      size={15}
                      className={`mt-0.5 shrink-0 ${isExpired || graceOver ? 'text-warning' : 'text-text-tertiary'}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate flex items-center gap-2">
                        {tok.name}
                        {tok.is_legacy && (
                          <Badge variant="warning" size="sm">
                            {t('settings.tok_legacy_badge')}
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        {t('settings.tok_created_prefix')} {format(new Date(tok.created_at), 'd MMM yyyy', { locale: getDateLocale() })}
                        {tok.last_used_at && (
                          <> · {t('settings.tok_used_prefix')} {formatDistanceToNow(new Date(tok.last_used_at), { addSuffix: true, locale: getDateLocale() })}</>
                        )}
                        {!tok.last_used_at && <> · {t('settings.tok_never_used')}</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {tok.expires_at ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isExpired
                          ? 'bg-warning-light text-warning'
                          : 'bg-surface-2 text-text-secondary'
                      }`}>
                        {isExpired
                          ? t('settings.tok_expired')
                          : `${t('settings.tok_expires_prefix')} ${formatDistanceToNow(new Date(tok.expires_at), { addSuffix: true, locale: getDateLocale() })}`}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-secondary">
                        {t('settings.tok_no_expiration')}
                      </span>
                    )}
                    <button
                      onClick={() => revoke.mutate(tok.id)}
                      title={t('settings.tok_revoke')}
                      className="p-1.5 rounded-md text-text-tertiary hover:text-danger hover:bg-danger-light transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-2 pl-[26px]">
                  <p className="text-xs text-text-secondary mb-1">
                    {t('settings.tok_scopes_label')}
                  </p>
                  <TokenScopeList scopes={tok.scopes} />
                  {tok.is_legacy && tok.legacy_grace_until && (
                    <p className="mt-1.5 text-xs text-warning">
                      {graceOver
                        ? t('settings.tok_legacy_over')
                        : t('settings.tok_legacy_until', {
                            date: format(new Date(tok.legacy_grace_until), 'd MMMM yyyy', {
                              locale: getDateLocale(),
                            }),
                          })}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 p-3 bg-surface-1 rounded-lg border border-border">
        <p className="text-xs text-text-secondary">
          <strong className="text-text-primary">{t('settings.tok_cli')}</strong>{' '}
          <code className="font-mono bg-surface-2 px-1 py-0.5 rounded">
            kubuno &lt;module&gt;:&lt;commande&gt; --token kubuno_xxx
          </code>
          {' '}{t('settings.tok_or_env')}{' '}
          <code className="font-mono bg-surface-2 px-1 py-0.5 rounded">KUBUNO_TOKEN</code>.
        </p>
      </div>
    </div>
  )
}
