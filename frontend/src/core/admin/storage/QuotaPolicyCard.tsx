import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Lock, Pencil, Plus, RotateCcw } from 'lucide-react'
import { Button, Callout, Card } from '@ui'
import { api } from '../../api/client'
import type { OrgUnit } from '../../types'
import { useConfirm } from '../../hooks/useConfirm'
import ConfirmDialog from '@ui/ConfirmDialog'
import { PRIV } from '../../authz/types'
import { usePrivileges } from '../../authz/usePrivileges'
import { formatBytes } from '../sections/format'
import OrgUnitPicker from '../OrgUnitPicker'
import { QuotaField, splitQuota, toBytes, type QuotaUnit } from './QuotaField'
import { errorMessage, useSetDefaultQuota, type StorageOverview } from './api'

/**
 * The default a new account receives — one instance value, plus the units that
 * decide otherwise.
 *
 * ## Only the levels somebody wrote
 *
 * The list shows the instance value and every unit that carries its own row.
 * Units that inherit are absent on purpose: listing forty units with the same
 * inherited figure would bury the three that were actually decided, and
 * "inherits" is the default state of everything anyway.
 *
 * ## Reverting is a delete, not a copy
 *
 * "Back to inherited" removes the unit's row rather than writing the parent's
 * value into it. That is what makes the unit keep following its parent
 * afterwards — a copied value would silently freeze the day the parent moved.
 *
 * ## It applies to NEW accounts
 *
 * A quota is stored on the account, so raising the default does not raise
 * anybody's existing ceiling. The card says so rather than letting an operator
 * assume a retroactive policy and discover otherwise from a support ticket.
 */
export default function QuotaPolicyCard({ overview }: { overview: StorageOverview }) {
  const { t } = useTranslation()
  const { can } = usePrivileges()
  const canManage = can(PRIV.SETTINGS_MANAGE)
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  // `null` targets the instance level; a string targets that unit.
  const [editing, setEditing] = useState<{ unitId: string | null; name: string } | null>(null)
  const [picking, setPicking] = useState(false)
  const [amount, setAmount]   = useState('10')
  const [unit, setUnit]       = useState<QuotaUnit>('GiB')
  const [error, setError]     = useState<string | null>(null)

  const save = useSetDefaultQuota()
  const policy = overview.policy

  // Same query key as the picker, so naming the unit an operator just chose
  // costs nothing: the list is already in the cache by the time they choose.
  const { data: units } = useQuery({
    queryKey:  ['admin-org-units'],
    queryFn:   () => api.get<{ org_units: OrgUnit[] }>('/admin/org-units').then(r => r.data.org_units),
    staleTime: 30_000,
    enabled:   canManage,
  })

  const openEditor = (unitId: string | null, name: string, bytes: number | null) => {
    const split = splitQuota(bytes ?? 10 * 1024 ** 3)
    setAmount(split.amount)
    setUnit(split.unit)
    setError(null)
    setEditing({ unitId, name })
  }

  const submit = async () => {
    if (!editing) return
    const bytes = toBytes(amount, unit)
    if (bytes == null) { setError(t('admin.sto_quota_invalid')); return }
    try {
      await save.mutateAsync({ unitId: editing.unitId, bytes })
      setEditing(null)
    } catch (e) {
      setError(errorMessage(e, t('admin.sto_policy_failed')))
    }
  }

  const revert = async (unitId: string, name: string) => {
    const ok = await confirm({
      title:        t('admin.sto_policy_revert_title'),
      message:      t('admin.sto_policy_revert_msg', { name }),
      confirmLabel: t('admin.sto_policy_revert'),
    })
    if (!ok) return
    try {
      await save.mutateAsync({ unitId, bytes: null })
    } catch (e) {
      setError(errorMessage(e, t('admin.sto_policy_failed')))
    }
  }

  return (
    <Card
      title={t('admin.sto_policy_title')}
      subtitle={t('admin.sto_policy_sub')}
      actions={canManage ? (
        <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setPicking(true)}>
          {t('admin.sto_policy_add_unit')}
        </Button>
      ) : undefined}
    >
      <ul className="flex flex-col divide-y divide-border">
        {/* The instance level always exists — it is the floor everything else
            inherits from, so it is a row rather than a special case. */}
        <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 first:pt-0">
          <span className="min-w-0 flex-1 truncate text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
            {t('admin.sto_policy_instance')}
          </span>
          <span className="tabular-nums text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
            {policy.instance_bytes != null ? formatBytes(policy.instance_bytes) : '—'}
          </span>
          {policy.instance_locked && (
            <Lock size={14} className="text-text-tertiary" aria-label={t('admin.sto_policy_locked')} />
          )}
          {canManage && (
            <Button
              variant="ghost" size="sm" icon={<Pencil size={14} />}
              onClick={() => openEditor(null, t('admin.sto_policy_instance'), policy.instance_bytes)}
            >
              {t('admin.sto_policy_edit')}
            </Button>
          )}
        </li>

        {policy.units.map(u => (
          <li key={u.unit_id ?? u.unit_name} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
            <span className="min-w-0 flex-1 truncate text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
              {u.unit_name}
            </span>
            <span className="tabular-nums text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
              {u.bytes != null ? formatBytes(u.bytes) : '—'}
            </span>
            {u.locked && (
              <Lock size={14} className="text-text-tertiary" aria-label={t('admin.sto_policy_locked')} />
            )}
            {canManage && u.unit_id && (
              <>
                <Button
                  variant="ghost" size="sm" icon={<Pencil size={14} />}
                  onClick={() => openEditor(u.unit_id, u.unit_name, u.bytes)}
                >
                  {t('admin.sto_policy_edit')}
                </Button>
                <Button
                  variant="ghost" size="sm" icon={<RotateCcw size={14} />}
                  onClick={() => void revert(u.unit_id as string, u.unit_name)}
                >
                  {t('admin.sto_policy_revert')}
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>

      {policy.units.length === 0 && (
        <p className="mt-3 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.sto_policy_no_unit')}
        </p>
      )}

      {error && (
        <p className="mt-3 text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>
          {error}
        </p>
      )}

      {editing && (
        <div className="mt-4 rounded-lg border border-border bg-surface-1 p-3">
          <QuotaField
            label={t('admin.sto_policy_field', { name: editing.name })}
            amount={amount}
            unit={unit}
            onAmount={setAmount}
            onUnit={setUnit}
            autoFocus
          />
          <Callout variant="info" className="mt-3" t={t}>
            {t('admin.sto_policy_new_only')}
          </Callout>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>{t('admin.sto_cancel')}</Button>
            <Button variant="primary" disabled={save.isPending} onClick={() => void submit()}>
              {t('admin.sto_save')}
            </Button>
          </div>
        </div>
      )}

      {picking && (
        <OrgUnitPicker
          title={t('admin.sto_policy_pick_unit')}
          currentId={null}
          onSelect={id => {
            const existing = policy.units.find(u => u.unit_id === id)
            const name = existing?.unit_name ?? units?.find(u => u.id === id)?.name ?? ''
            openEditor(id, name, existing?.bytes ?? policy.instance_bytes)
          }}
          onClose={() => setPicking(false)}
        />
      )}

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </Card>
  )
}
