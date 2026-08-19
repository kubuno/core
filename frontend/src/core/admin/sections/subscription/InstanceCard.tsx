import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Check, Copy } from 'lucide-react'
import { Button, Card } from '@ui'
import { formatDay } from '../format'
import Field from './Field'
import type { AccountCounts, InstanceInfo } from './api'

/**
 * Which installation this is.
 *
 * Every field here already existed somewhere — the name is `instance.name`, the
 * version is what `/health` reports, the account counts are the dashboard's —
 * except the identifier and the installation date, which had no home until
 * migration `000120`. The identifier is minted locally and transmitted nowhere:
 * it exists so that an operator opening a ticket can say *which* instance, and
 * for nothing else.
 */
export default function InstanceCard({
  instance, accounts,
}: {
  instance: InstanceInfo
  accounts: AccountCounts | null
}) {
  const { t, i18n } = useTranslation()
  const [copied, setCopied] = useState(false)

  // Guarded rather than assumed: the Clipboard API is unavailable outside a
  // secure context, which is exactly where a self-hosted instance reached by
  // plain IP lives. No button rather than a button that silently does nothing.
  const canCopy = typeof navigator !== 'undefined' && !!navigator.clipboard
  const copy = () => {
    void navigator.clipboard.writeText(instance.instance_id).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Card
      title={t('admin.sub_instance_title')}
      icon={<Building2 size={16} />}
      subtitle={t('admin.sub_instance_subtitle')}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('admin.sub_instance_name')}>
          {instance.name ?? '—'}
        </Field>
        <Field label={t('admin.sub_instance_version')}>
          {t('admin.sub_instance_version_value', { version: instance.core_version })}
        </Field>
        <Field label={t('admin.sub_instance_installed')}>
          {formatDay(instance.installed_at, i18n.language)}
        </Field>
        {accounts && (
          <Field label={t('admin.sub_instance_accounts')}>
            {t('admin.sub_instance_accounts_value', {
              active: accounts.active, total: accounts.total,
            })}
          </Field>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <Field label={t('admin.sub_instance_id')}>
          <span className="flex flex-wrap items-center gap-2">
            {/* The face is on the value alone: a monospaced "Copier" beside it
                would read as part of the identifier. */}
            <span className="break-all font-mono">{instance.instance_id}</span>
            {canCopy && (
              <Button
                variant="text"
                size="sm"
                icon={copied ? <Check size={14} /> : <Copy size={14} />}
                onClick={copy}
              >
                {copied ? t('admin.sub_copied') : t('admin.sub_copy')}
              </Button>
            )}
          </span>
        </Field>
        <p className="mt-2 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.sub_instance_id_hint')}
        </p>
      </div>
    </Card>
  )
}
