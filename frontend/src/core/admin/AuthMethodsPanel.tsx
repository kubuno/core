import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Network, ShieldCheck, Terminal } from 'lucide-react'
import { Button, Callout, Card, Spinner, Toggle, useToast } from '@ui'
import { api } from '../api/client'
import { useConfirm } from '../hooks/useConfirm'
import ConfirmDialog from '@ui/ConfirmDialog'
import SettingScopeBar from './settings/SettingScopeBar'
import { INSTANCE_SCOPE, type ActiveScope, type ResolvedSetting } from './settings/scopeTypes'

/**
 * Administration → Security → Authentication & SSO — **which methods this scope
 * accepts**.
 *
 * The method is an administrator's decision, per organisational unit. This panel
 * is the editor for `auth.methods` and `auth.local_admin_fallback`, both of them
 * ordinary scoped settings, so the inheritance machinery (breadcrumb, "inherited
 * from", "revert") is the one every other setting uses. What is purpose-built
 * here is the *control*: three switches rather than a JSON array in a text
 * field, and the two things an operator must read before flipping one —
 * what happens if the chosen method becomes unreachable, and how to get back in.
 */

const KEY_METHODS = 'auth.methods'
const KEY_FALLBACK = 'auth.local_admin_fallback'

type MethodId = 'local' | 'directory' | 'sso'
const ALL: MethodId[] = ['local', 'directory', 'sso']

interface ScopedResponse {
  settings: ResolvedSetting[]
}

const asMethods = (value: unknown): MethodId[] =>
  Array.isArray(value) ? ALL.filter(m => (value as unknown[]).includes(m)) : []

function MethodRow({
  id,
  icon,
  checked,
  disabled,
  onChange,
  t,
}: {
  id: MethodId
  icon: React.ReactNode
  checked: boolean
  disabled: boolean
  onChange: (v: boolean) => void
  t: (k: string) => string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 shrink-0 text-text-tertiary">{icon}</span>
        <div className="min-w-0">
          <p className="font-medium text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
            {t(`authmethods.${id}`)}
          </p>
          <p className="mt-0.5 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t(`authmethods.${id}_desc`)}
          </p>
        </div>
      </div>
      <Toggle checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />
    </div>
  )
}

export default function AuthMethodsPanel() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const toast = useToast()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
  const [scope, setScope] = useState<ActiveScope>(INSTANCE_SCOPE)

  const scopeParams = { scope_type: scope.type, scope_id: scope.id ?? undefined }

  const { data, isLoading, isError } = useQuery({
    retry: false,
    queryKey: ['admin-auth-methods', scope.type, scope.id] as const,
    queryFn: () =>
      api
        .get<ScopedResponse>('/admin/settings/resolved', { params: scopeParams })
        .then(r => r.data.settings),
  })

  const methodsSetting = data?.find(s => s.key === KEY_METHODS)
  const fallbackSetting = data?.find(s => s.key === KEY_FALLBACK)

  const methods = useMemo(() => asMethods(methodsSetting?.value), [methodsSetting])
  const fallback = fallbackSetting?.value === true

  const errorOf = (e: unknown) =>
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message

  const write = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      api.put(`/admin/settings/scoped/${encodeURIComponent(key)}`, { ...scopeParams, value }),
    onSuccess: () => {
      toast.success(t('authmethods.saved'))
      qc.invalidateQueries({ queryKey: ['admin-auth-methods'] })
      qc.invalidateQueries({ queryKey: ['admin-settings-resolved'] })
    },
    // The server's refusal is the interesting part: it names the administrators
    // who would be shut out and how to get back in. Shown verbatim.
    onError: (e: unknown) => toast.error(errorOf(e) || t('authmethods.refused')),
  })

  const revert = useMutation({
    mutationFn: (key: string) =>
      api.delete(`/admin/settings/scoped/${encodeURIComponent(key)}`, { params: scopeParams }),
    onSuccess: () => {
      toast.success(t('authmethods.reverted'))
      qc.invalidateQueries({ queryKey: ['admin-auth-methods'] })
    },
    onError: (e: unknown) => toast.error(errorOf(e) || t('authmethods.refused')),
  })

  const lockedAbove = methodsSetting?.locked_above ?? false

  /** Flipping a method: confirm FIRST, with what it costs if that method breaks. */
  const toggleMethod = async (id: MethodId, on: boolean) => {
    const next = on ? [...new Set([...methods, id])] : methods.filter(m => m !== id)
    if (next.length === 0) {
      toast.error(t('authmethods.err_empty'))
      return
    }
    if (!on) {
      const ok = await confirm({
        title: t('authmethods.confirm_title'),
        message: t(`authmethods.confirm_off_${id}`),
        confirmLabel: t('authmethods.confirm_apply'),
        variant: 'danger',
      })
      if (!ok) return
    }
    write.mutate({ key: KEY_METHODS, value: next })
  }

  const toggleFallback = async (on: boolean) => {
    if (!on) {
      const ok = await confirm({
        title: t('authmethods.confirm_title'),
        message: t('authmethods.confirm_off_fallback'),
        confirmLabel: t('authmethods.confirm_apply'),
        variant: 'danger',
      })
      if (!ok) return
    }
    write.mutate({ key: KEY_FALLBACK, value: on })
  }

  if (isLoading) {
    return <div className="flex justify-center py-10"><Spinner /></div>
  }

  // A delegated operator may hold `core.auth_providers.*` (which opens this page)
  // without `core.settings.*` (which this card reads). Saying so beats painting
  // three switches that all look "off" because nothing could be loaded.
  if (isError || !data) {
    return (
      <div className="max-w-3xl">
        <Callout variant="warning">{t('authmethods.no_access')}</Callout>
      </div>
    )
  }

  const inheritedFrom = methodsSetting?.source?.scope_name
  const hasOwn = methodsSetting?.has_own_value ?? false

  return (
    <div className="max-w-3xl">
      <SettingScopeBar scope={scope} onChange={setScope} sticky={false} />

      <Card title={t('authmethods.title')} icon={<ShieldCheck size={17} />}>
        <div className="space-y-4">
          <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
            {t('authmethods.subtitle')}
          </p>

          {/* Provenance, before anything can be flipped: an administrator who
              cannot tell "this unit decided" from "it inherited" will eventually
              reconfigure the instance believing they touched one branch. */}
          {scope.type === 'org_unit' && (
            <Callout variant="info">
              {hasOwn
                ? t('authmethods.own_value')
                : t('authmethods.inherited', { from: inheritedFrom ?? t('admin.scope_instance') })}
            </Callout>
          )}

          {lockedAbove && <Callout variant="warning">{t('authmethods.locked_above')}</Callout>}

          <div className="space-y-4">
            <MethodRow
              id="local"
              icon={<KeyRound size={17} />}
              checked={methods.includes('local')}
              disabled={lockedAbove || write.isPending}
              onChange={v => toggleMethod('local', v)}
              t={t}
            />
            <MethodRow
              id="directory"
              icon={<Network size={17} />}
              checked={methods.includes('directory')}
              disabled={lockedAbove || write.isPending}
              onChange={v => toggleMethod('directory', v)}
              t={t}
            />
            <MethodRow
              id="sso"
              icon={<ShieldCheck size={17} />}
              checked={methods.includes('sso')}
              disabled={lockedAbove || write.isPending}
              onChange={v => toggleMethod('sso', v)}
              t={t}
            />
          </div>

          {scope.type === 'org_unit' && hasOwn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => revert.mutate(KEY_METHODS)}
              loading={revert.isPending}
            >
              {t('authmethods.revert')}
            </Button>
          )}
        </div>
      </Card>

      <div className="mt-4">
        <Card title={t('authmethods.fallback_title')} icon={<KeyRound size={17} />}>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
                  {t('authmethods.fallback_label')}
                </p>
                <p className="mt-0.5 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {t('authmethods.fallback_desc')}
                </p>
              </div>
              <Toggle
                checked={fallback}
                disabled={(fallbackSetting?.locked_above ?? false) || write.isPending}
                onChange={e => toggleFallback(e.target.checked)}
              />
            </div>

            {!fallback && <Callout variant="warning">{t('authmethods.fallback_off_warning')}</Callout>}

            {/* The way back in, written next to the switch that can close the
                door. It is not a footnote: it is the reason the switch is
                allowed to exist at all. */}
            <Callout variant="info" title={t('authmethods.recovery_title')}>
              <p>{t('authmethods.recovery_body')}</p>
              <pre
                className="mt-2 max-w-full overflow-x-auto rounded-md border border-border bg-surface-1 px-2.5 py-2 font-mono text-text-primary"
                style={{ fontSize: 'var(--kb-text-meta)' }}
              >
                sudo kubuno auth:recover admin@exemple.com --local-access --set-password
              </pre>
              <p className="mt-2 flex items-start gap-2">
                <Terminal size={15} className="mt-0.5 shrink-0" />
                <span>{t('authmethods.recovery_note')}</span>
              </p>
            </Callout>
          </div>
        </Card>
      </div>

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
