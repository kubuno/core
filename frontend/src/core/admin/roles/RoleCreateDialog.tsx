import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Callout, Input, Textarea, useToast } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import FieldLabel from '../sections/resources/FieldLabel'
import type { Privilege } from '../../authz/types'
import PrivilegeList from './PrivilegeList'
import { errorMessage, useCreateRole } from './api'

/** `Nom du rôle` → `nom-du-role`, the shape the server validates. */
function slugify(value: string): string {
  return value
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

/**
 * Define a new role: identity, description and its privilege set.
 *
 * A dialog is the right shape here and only here — there is no record yet, so
 * there is nothing to edit in place. Changing an existing role happens on its
 * sheet (`RoleIdentityCard`, `RolePrivilegesCard`), which is where its name,
 * description and privileges are read. This form used to do both, which is how
 * the sheet ended up displaying three things it could not change.
 *
 * Defining a role is super-user-only server-side (whoever writes a role can
 * write themselves a role), so this dialog is only ever opened for one. It shows
 * the delegability verdict live while privileges are picked — the operator finds
 * out that a role has just become instance-only *while choosing*, not two
 * screens later when the assignment is refused.
 */
export default function RoleCreateDialog({
  catalogue, onClose,
}: {
  catalogue: Privilege[]
  onClose:   () => void
}) {
  const { t } = useTranslation()
  const toast = useToast()

  const [name, setName]     = useState('')
  const [slug, setSlug]     = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [error, setError]   = useState('')

  const keys = useMemo(() => catalogue.map(p => p.key), [catalogue])
  const byKey = useMemo(() => new Map(catalogue.map(p => [p.key, p])), [catalogue])

  // Everything the role would carry that cannot be confined to a subtree.
  const blockers = useMemo(
    () => [...selected].filter(k => byKey.get(k) && !byKey.get(k)!.is_ou_scopable),
    [selected, byKey],
  )

  const create = useCreateRole(() => { toast.success(t('admin.role_created')); onClose() })

  const toggle = (key: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  // Also reachable from the window's own footer, which is outside the form.
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    create.mutate(
      {
        name:        name.trim(),
        description: description.trim() || null,
        privileges:  [...selected],
        slug:        slug.trim() || slugify(name),
      },
      { onError: err => setError(errorMessage(err, t('admin.role_create_error'))) },
    )
  }

  return (
    <FloatingWindow
      title={t('admin.roles_create')}
      onClose={onClose}
      defaultWidth={680}
      backdrop
      t={t}
      actions={{
        confirm: {
          label:    t('settings.create'),
          onClick:  () => submit(),
          disabled: !name.trim(),
          loading:  create.isPending,
        },
        cancel: { label: t('common.cancel') },
      }}
    >
      <form onSubmit={submit} className="flex flex-col max-h-[78vh]">
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={<>{t('admin.role_name')}<span className="text-danger ml-0.5">*</span></>}
              value={name}
              onChange={e => {
                setName(e.target.value)
                if (!slugTouched) setSlug(slugify(e.target.value))
              }}
              placeholder={t('admin.role_name_ph')}
              required
            />
            <Input
              label={t('admin.role_slug')}
              value={slug}
              onChange={e => { setSlugTouched(true); setSlug(slugify(e.target.value)) }}
              placeholder="admin-marketing"
              hint={t('admin.role_slug_hint')}
            />
          </div>

          <Textarea
            label={t('admin.roles_col_desc')}
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            placeholder={t('admin.role_desc_ph')}
          />

          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <FieldLabel>{t('admin.roles_privileges')}</FieldLabel>
            <p className="text-sm text-text-secondary">
              {t('admin.priv_selected', { count: selected.size })}
            </p>
          </div>

          {blockers.length > 0 ? (
            <Callout variant="warning" title={t('admin.role_not_delegable_title')} t={t}>
              {t('admin.role_not_delegable_desc', { count: blockers.length })}
            </Callout>
          ) : selected.size > 0 && (
            <Callout variant="success" title={t('admin.role_delegable_title')} t={t}>
              {t('admin.role_delegable_desc')}
            </Callout>
          )}

          <div className="border border-border rounded-lg overflow-hidden">
            <PrivilegeList
              keys={keys}
              catalogue={catalogue}
              selected={selected}
              onToggle={toggle}
            />
          </div>

          {error && <Callout variant="danger" t={t}>{error}</Callout>}
        </div>
      </form>
    </FloatingWindow>
  )
}
