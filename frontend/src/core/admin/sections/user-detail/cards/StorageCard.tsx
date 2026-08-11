import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HardDrive } from 'lucide-react'
import { Callout, ProgressBar } from '@ui'
import { PRIV } from '../../../../authz/types'
import { usePrivileges } from '../../../../authz/usePrivileges'
import type { User } from '../../../../types'
import { useAdminAction } from '../../../adminAction'
import EditableCard from '../../../inline-edit/EditableCard'
import { QuotaField, splitQuota, toBytes, type QuotaUnit } from '../../../storage/QuotaField'
import { formatBytes } from '../../format'
import { accountError, useUpdateAccount } from '../useAccountEdit'

/**
 * The account's ceiling, edited where it is read.
 *
 * `QuotaField` is the storage page's own control, borrowed rather than
 * re-implemented: a byte count is the thing an operator gets wrong —
 * `53687091200` and `5368709120` differ by one character and by a factor of ten
 * — and the two screens that set a quota must not disagree about how it is
 * typed. It also replaces the 0–200 Go slider the edit window used, which could
 * not express the ceiling of an account already above 200 Go.
 *
 * Lowering below current usage is allowed — it is a legitimate way to stop
 * growth — and warned about rather than refused, exactly as on the storage page.
 */
export default function StorageCard({ user }: { user: User }) {
  const { t } = useTranslation()
  const { can } = usePrivileges()

  const [editing, setEditing] = useState(false)
  const initial = splitQuota(user.quota_bytes)
  const [amount, setAmount] = useState(initial.amount)
  const [unit, setUnit]     = useState<QuotaUnit>(initial.unit)

  const canEdit = can(PRIV.USERS_UPDATE, user.org_unit_id)
  const save = useUpdateAccount(user.id)

  const bytes = toBytes(amount, unit)
  const dirty = bytes != null && bytes !== user.quota_bytes
  const below = bytes != null && bytes < user.used_bytes

  const reset = () => {
    const fresh = splitQuota(user.quota_bytes)
    setAmount(fresh.amount)
    setUnit(fresh.unit)
  }
  const stop = () => { setEditing(false); save.reset(); reset() }

  // `…?action=set-quota` — the verb a full-account alert points at, and the one
  // the storage page forwards here now that the ceiling is edited on the sheet.
  // It opens the card already in edit mode rather than dropping the operator on
  // a page and leaving them to find the pencil.
  useAdminAction('set-quota', () => { if (canEdit) { reset(); setEditing(true) } })

  const submit = () => {
    if (bytes == null) return
    save.mutate({ quota_bytes: bytes }, {
      onSuccess: () => { setEditing(false); save.reset() },
    })
  }

  const shown = editing && bytes != null ? bytes : user.quota_bytes
  const pct = shown > 0 ? (user.used_bytes / shown) * 100 : 0

  return (
    <EditableCard
      title={t('admin.ud_card_storage')}
      icon={<HardDrive size={16} />}
      canEdit={canEdit}
      editing={editing}
      onEdit={() => { reset(); save.reset(); setEditing(true) }}
      onCancel={stop}
      onSave={submit}
      dirty={dirty}
      saving={save.isPending}
      error={save.isError ? (accountError(save.error) ?? t('admin.sto_quota_failed')) : undefined}
    >
      {/* The bar keeps following the value being typed, so what a new ceiling
          does to this account is visible before it is written. */}
      <ProgressBar
        t={t}
        value={user.used_bytes}
        max={Math.max(shown, 1)}
        label={t('admin.ud_quota_used', {
          used:  formatBytes(user.used_bytes),
          quota: formatBytes(shown),
        })}
        showValue
        formatValue={() => `${pct.toFixed(pct < 10 ? 1 : 0)} %`}
      />

      {editing && (
        <div className="mt-4 flex flex-col gap-3">
          <QuotaField
            label={t('admin.sto_quota_field')}
            amount={amount}
            unit={unit}
            onAmount={setAmount}
            onUnit={setUnit}
            autoFocus
            error={bytes == null ? t('admin.sto_quota_invalid') : undefined}
          />
          {below && (
            <Callout variant="warning" t={t} title={t('admin.sto_quota_below_title')}>
              {t('admin.sto_quota_below_desc', { used: formatBytes(user.used_bytes) })}
            </Callout>
          )}
        </div>
      )}
    </EditableCard>
  )
}
