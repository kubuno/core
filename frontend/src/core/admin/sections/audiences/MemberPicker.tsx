// Adding members to an audience: groups first, accounts if no group fits.
//
// Groups are listed above accounts and labelled with how many active people they
// bring in, because that number is the whole decision. "Add Tous les salariés" is
// a different act depending on whether it means eight people or eight hundred,
// and an administrator who cannot see which is which will find out by widening a
// proposal they thought was narrow.

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Users, User as UserIcon } from 'lucide-react'
import { Callout, Checkbox, EmptyState, Input, foldIncludes } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import { api } from '../../../api/client'
import type { AudienceMember } from './api'

interface Candidate {
  member_type: 'user' | 'group'
  member_id:   string
  label:       string
  sub:         string | null
  /** Active accounts a group brings in. Null for an individual account. */
  reach:       number | null
}

export default function MemberPicker({
  already, busy, error, onAdd, onCancel,
}: {
  already:  AudienceMember[]
  busy:     boolean
  error?:   string
  onAdd:    (members: { member_type: string; member_id: string }[]) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<Record<string, Candidate>>({})

  const groups = useQuery({
    queryKey: ['admin', 'groups'],
    queryFn: async () => (await api.get<{ groups: { id: string; name: string; member_count: number }[] }>('/admin/groups')).data.groups,
  })
  const users = useQuery({
    queryKey: ['admin', 'users', 'picker'],
    queryFn: async () => (await api.get<{ users: { id: string; email: string; display_name: string | null; username: string; is_active: boolean }[] }>('/admin/users?limit=500')).data.users,
  })

  // Anything already in the audience is not offered again: re-adding is a no-op
  // server-side, so showing it would be an action that appears to do something.
  const taken = useMemo(
    () => new Set(already.map(m => `${m.member_type}:${m.member_id}`)),
    [already],
  )

  const candidates = useMemo<Candidate[]>(() => {
    const g: Candidate[] = (groups.data ?? []).map(x => ({
      member_type: 'group', member_id: x.id, label: x.name, sub: null, reach: x.member_count,
    }))
    const u: Candidate[] = (users.data ?? [])
      .filter(x => x.is_active)
      .map(x => ({
        member_type: 'user', member_id: x.id,
        label: x.display_name || x.username, sub: x.email, reach: null,
      }))
    return [...g, ...u].filter(c => !taken.has(`${c.member_type}:${c.member_id}`))
  }, [groups.data, users.data, taken])

  // Accent-insensitive, like every other filter in the console: an operator
  // typing "equipe" must find "Équipe".
  const shown = useMemo(
    () => (q.trim()
      ? candidates.filter(c => foldIncludes(c.label, q) || (c.sub ? foldIncludes(c.sub, q) : false))
      : candidates),
    [candidates, q],
  )

  const toggle = (c: Candidate) => setPicked(p => {
    const k = `${c.member_type}:${c.member_id}`
    const next = { ...p }
    if (next[k]) delete next[k]; else next[k] = c
    return next
  })

  const chosen = Object.values(picked)
  // What the whole selection would add, groups resolved. Individual accounts
  // count as one; a group's members may overlap, so this is an upper bound and
  // the sheet's own reach figure is the exact one.
  const addedReach = chosen.reduce((n, c) => n + (c.reach ?? 1), 0)

  return (
    <div onMouseDown={e => e.stopPropagation()}>
      <FloatingWindow
        title={t('admin.aud_add_members', { defaultValue: 'Ajouter des membres' })}
        onClose={onCancel}
        defaultWidth={600}
        backdrop
        t={t}
        actions={{
          extra: (
            <span className="text-sm text-text-secondary">
              {chosen.length > 0
                ? t('admin.aud_picked_summary', {
                    defaultValue_one: '{{count}} sélectionné · comptes atteints : {{reach}} au plus',
                    defaultValue: '{{count}} sélectionnés · comptes atteints : {{reach}} au plus',
                    count: chosen.length, reach: addedReach,
                  })
                : ''}
            </span>
          ),
          confirm: {
            label:    t('common.add', { defaultValue: 'Ajouter' }),
            onClick:  () => onAdd(chosen.map(c => ({ member_type: c.member_type, member_id: c.member_id }))),
            disabled: chosen.length === 0 || busy,
          },
          cancel: { label: t('common.cancel', { defaultValue: 'Annuler' }), disabled: busy },
        }}
      >
        <div className="flex max-h-[65vh] flex-col gap-3 overflow-hidden p-4">
          <Input
            value={q}
            autoFocus
            onChange={e => setQ(e.target.value)}
            placeholder={t('admin.aud_search_ph', { defaultValue: 'Rechercher un groupe ou un compte…' })}
            hint={t('admin.aud_prefer_groups', {
              defaultValue: 'Préférez un groupe : l’audience suivra l’organisation sans être rééditée.',
            })}
          />

          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border">
            {shown.length === 0 ? (
              <EmptyState
                icon={<Users size={20} />}
                title={t('admin.aud_no_candidate', { defaultValue: 'Aucun groupe ni compte à ajouter' })}
              />
            ) : shown.map(c => {
              const k = `${c.member_type}:${c.member_id}`
              return (
                <label key={k}
                       className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2 last:border-b-0 hover:bg-surface-1">
                  <Checkbox checked={!!picked[k]} onChange={() => toggle(c)} />
                  {c.member_type === 'group'
                    ? <Users size={14} className="shrink-0 text-text-tertiary" />
                    : <UserIcon size={14} className="shrink-0 text-text-tertiary" />}
                  <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{c.label}</span>
                  {c.sub && <span className="truncate text-xs text-text-tertiary">{c.sub}</span>}
                  {c.reach !== null && (
                    <span className="shrink-0 text-xs text-text-secondary">
                      {t('admin.aud_group_reach', {
                        defaultValue_one: '{{count}} compte',
                        defaultValue: '{{count}} comptes',
                        count: c.reach,
                      })}
                    </span>
                  )}
                </label>
              )
            })}
          </div>

          {error && <Callout variant="danger">{error}</Callout>}
        </div>
      </FloatingWindow>
    </div>
  )
}
