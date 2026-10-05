/**
 * The parts of `StorageCard.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Cloud, HardDrive } from "lucide-react"
import { Callout, ProgressBar } from "@ui"
import EditableCard from "../../../inline-edit/EditableCard"
import { QuotaField } from "../../../storage/QuotaField"
import { formatBytes } from "../../format"
import { accountError } from "../useAccountEdit"
import type { StorageCard } from './StorageCard'

export function Part1({ t, canEdit, editing, reset, save, setEditing, stop, submit, dirty, user, usage, shown, pct, amount, unit, setAmount, setUnit, bytes, below }: { t: NonNullable<StorageCard['tr']>; canEdit: NonNullable<StorageCard['canEdit']>; editing: NonNullable<StorageCard['editing']>; reset: StorageCard['reset']; save: NonNullable<StorageCard['save']>; setEditing: NonNullable<StorageCard['setEditing']>; stop: StorageCard['stop']; submit: StorageCard['submit']; dirty: NonNullable<StorageCard['dirty']>; user: NonNullable<StorageCard['props']['user']>; usage: NonNullable<StorageCard['usage']>; shown: NonNullable<StorageCard['shown']>; pct: NonNullable<StorageCard['pct']>; amount: NonNullable<StorageCard['amount']>; unit: NonNullable<StorageCard['unit']>; setAmount: NonNullable<StorageCard['setAmount']>; setUnit: NonNullable<StorageCard['setUnit']>; bytes: StorageCard['bytes']; below: NonNullable<StorageCard['below']> }) {
  return (
    <EditableCard
          title={t('admin.ud_card_storage')}
          icon={<HardDrive size={16} />}
          // Full width: the total and the per-module figures are a row of readings,
          // and squeezing them into half the sheet wraps each one onto three lines.
          className="lg:col-span-2"
          canEdit={canEdit}
          editing={editing}
          onEdit={() => { reset(); save.reset(); setEditing(true) }}
          onCancel={stop}
          onSave={submit}
          dirty={dirty}
          saving={save.isPending}
          error={save.isError ? (accountError(save.error) ?? t('admin.sto_quota_failed')) : undefined}
        >
          {/* What is actually stored, before what is allowed. The total is the
              number enforcement reads; the modules beside it say where it comes
              from — the question an operator asks the moment the total surprises
              them. Read from the storage page's own endpoint rather than a second
              count of our own, so the sheet and that page can never disagree. */}
          <div className="mb-4 flex flex-wrap items-start gap-x-10 gap-y-4">
            <div className="flex items-center gap-3">
              <Cloud size={28} className="shrink-0 text-text-tertiary" />
              <div>
                <div className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {t('admin.sto_col_used')}
                </div>
                <div className="font-medium text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
                  {formatBytes(user.used_bytes)}
                </div>
              </div>
            </div>
    
            {usage.data && (
              usage.data.modules.length > 0 ? (
                <div className="flex flex-wrap items-start gap-x-8 gap-y-3 border-border sm:border-l sm:pl-10">
                  {usage.data.modules.map(m => (
                    <div key={m.module_id} className="min-w-[86px]">
                      <div className="truncate text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                        {m.display_name}
                      </div>
                      {/* `billable`, not `held`: the total beside it is the quota
                          counter, and a module's physical holdings include what it
                          charges to nobody. Mixing the two made the parts add up to
                          MORE than the whole, which reads as an arithmetic bug. */}
                      <div className="text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
                        {formatBytes(m.billable_bytes)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="max-w-sm text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {t('admin.sto_acct_mods_empty')}
                </p>
              )
            )}
          </div>
    
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
