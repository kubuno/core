// Declaring a domain: its name, and what it is *for*.
//
// The second question is the one people get wrong, and it is not a detail of
// storage — it decides whether the domain carries its own accounts or lends a
// second address to somebody else's. The two options are therefore written out
// as full sentences rather than as two words in a dropdown, with the
// consequence stated on each: "des comptes à ce domaine" against "une seconde
// adresse pour les comptes existants".

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Callout, Dropdown, Input } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import FieldLabel from '../resources/FieldLabel'
import { errorMessage, useAddDomain, type Domain, type DomainKind } from './api'

export default function AddDomainDialog({
  domains, onClose, onAdded,
}: {
  /** Candidates an alias can hang off: verified, non-alias. */
  domains: Domain[]
  onClose: () => void
  /** Called with the new domain, so the page can open its verification screen. */
  onAdded: (domain: Domain) => void
}) {
  const { t } = useTranslation()
  const [name, setName]     = useState('')
  const [kind, setKind]     = useState<DomainKind>('secondary')
  const [parent, setParent] = useState('')
  const [error, setError]   = useState<string | null>(null)

  const add = useAddDomain()
  const parents = domains.filter(d => d.kind !== 'alias' && d.verified)

  const submit = async () => {
    setError(null)
    try {
      const created = await add.mutateAsync({
        name: name.trim(),
        kind,
        parent_id: kind === 'alias' ? (parent || undefined) : undefined,
      })
      onClose()
      onAdded(created)
    } catch (e) {
      setError(errorMessage(e, t('admin.dom_save_failed')))
    }
  }

  const Choice = ({ value, title, description }: { value: DomainKind; title: string; description: string }) => (
    <label
      className={`flex cursor-pointer gap-3 rounded border p-3 transition-colors ${
        kind === value ? 'border-primary bg-primary-light' : 'border-border hover:bg-surface-1'
      }`}
    >
      <input
        type="radio"
        name="domain-kind"
        className="mt-1 accent-[var(--color-primary)]"
        checked={kind === value}
        onChange={() => setKind(value)}
      />
      <span className="min-w-0">
        <span className="block font-medium text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>{title}</span>
        <span className="block text-text-secondary" style={{ fontSize: 'var(--kb-text-small)' }}>{description}</span>
      </span>
    </label>
  )

  return (
    <div onMouseDown={e => e.stopPropagation()}>
      <FloatingWindow
        title={t('admin.dom_add_title')}
        onClose={onClose}
        defaultWidth={520}
        backdrop
        t={t}
        actions={{
          confirm: {
            label:    t('admin.dom_add_and_verify'),
            onClick:  () => void submit(),
            disabled: add.isPending || name.trim() === '' || (kind === 'alias' && parent === ''),
            loading:  add.isPending,
          },
          cancel: { label: t('admin.dom_cancel') },
        }}
      >
        <div className="flex flex-col gap-4 p-4">
          <Input
            label={t('admin.dom_field_name')}
            value={name}
            autoFocus
            maxLength={253}
            placeholder="exemple.fr"
            onChange={e => setName(e.target.value)}
            hint={t('admin.dom_field_name_hint')}
          />

          <div className="flex flex-col gap-2">
            <FieldLabel>{t('admin.dom_field_kind')}</FieldLabel>
            <Choice value="secondary" title={t('admin.dom_kind_secondary')} description={t('admin.dom_kind_secondary_desc')} />
            <Choice value="alias"     title={t('admin.dom_kind_alias')}     description={t('admin.dom_kind_alias_desc')} />
          </div>

          {kind === 'alias' && (
            <div className="flex flex-col gap-1">
              <FieldLabel>{t('admin.dom_field_parent')}</FieldLabel>
              {parents.length === 0 ? (
                // An alias of an unproven domain would launder the very claim
                // the registry exists to check.
                <Callout variant="warning" t={t}>{t('admin.dom_no_parent')}</Callout>
              ) : (
                <Dropdown
                  value={parent}
                  placeholder={t('admin.dom_field_parent_ph')}
                  options={parents.map(d => ({ value: d.id, label: d.name }))}
                  onChange={setParent}
                  width="100%"
                  height={36}
                  focusable
                />
              )}
            </div>
          )}

          <Callout variant="info" t={t}>{t('admin.dom_add_note')}</Callout>

          {error && (
            <p className="text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>{error}</p>
          )}
        </div>
      </FloatingWindow>
    </div>
  )
}
