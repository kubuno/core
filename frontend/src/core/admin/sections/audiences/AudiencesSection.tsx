// Target audiences — the curated recipient lists the instance offers at share
// time.
//
// The list answers the only question worth answering from a distance: how wide
// is each of these, and is it actually in use? Hence three figures per row, and
// not one. `member_count` is what you edit; `reach` is what happens; `applied_to`
// is whether it happens at all. An audience with a hundred people and nowhere to
// appear is defined, not deployed — and the row says so.
//
// The open audience lives in the URL (`/admin/audiences/<id>`) rather than in
// component state, so the browser's Back button leaves the sheet the way anybody
// expects.

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Plus, Search, Trash2, Users } from 'lucide-react'
import {
  Button, Callout, DataTable, EmptyState, Input, foldIncludes,
  type DataTableColumn, type DataTableRowAction,
} from '@ui'
import { usePrivileges } from '../../../authz/usePrivileges'
import { useConfirm } from '../../../hooks/useConfirm'
import ConfirmDialog from '@ui/ConfirmDialog'
import type { AdminSectionProps } from '../registry'
import { adminUrlWith } from '../../adminAction'
import { AUDIENCES_MANAGE } from './privileges'
import { useAudiences, useAudienceMutations, type Audience } from './api'
import AudienceDialog from './AudienceDialog'
import AudienceSheet from './AudienceSheet'

function errMessage(err: unknown): string | undefined {
  const e = err as { message?: string; response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? e?.message
}

export default function AudiencesSection({ params, navigate }: AdminSectionProps) {
  const { t }   = useTranslation()
  const { can } = usePrivileges()
  const canManage = can(AUDIENCES_MANAGE)

  const open = params.get('audience')
  const go = (id: string | null) => navigate(adminUrlWith('audiences', params, { audience: id }))

  const { data, isLoading, isError, refetch } = useAudiences()
  const { create, remove } = useAudienceMutations(null)
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
  const [creating, setCreating] = useState(false)
  const [q, setQ] = useState('')

  // Accent-insensitive, like every other filter in the console: an operator
  // typing "equipe" must find "Équipe".
  const rows = useMemo(() => {
    const all = data?.audiences ?? []
    if (!q.trim()) return all
    return all.filter(a => foldIncludes(a.name, q) || (a.description ? foldIncludes(a.description, q) : false))
  }, [data, q])

  if (open) return <AudienceSheet id={open} canManage={canManage} onBack={() => go(null)} />

  const askRemove = async (a: Audience) => {
    const ok = await confirm({
      title: t('admin.aud_delete_q', { defaultValue: 'Supprimer « {{name}} » ?', name: a.name }),
      // The count of places it is offered is the part nobody has in mind: the
      // same click removes a list and changes what several units are shown.
      message: a.applied_to > 0
        ? t('admin.aud_delete_applied', {
            defaultValue_one: 'Cette audience est proposée à {{count}} endroit. Elle cessera d’y apparaître. Les partages déjà effectués ne sont pas retirés.',
            defaultValue: 'Cette audience est proposée à {{count}} endroits. Elle cessera d’y apparaître. Les partages déjà effectués ne sont pas retirés.',
            count: a.applied_to,
          })
        : t('admin.aud_delete_msg', {
            defaultValue: 'Elle n’est proposée nulle part. Les partages déjà effectués ne sont pas retirés.',
          }),
      confirmLabel: t('common.delete', { defaultValue: 'Supprimer' }),
      variant: 'danger',
    })
    if (ok) remove.mutate(a.id)
  }

  const columns: DataTableColumn<Audience>[] = [
    {
      id: 'name',
      header: t('admin.aud_name', { defaultValue: 'Nom' }),
      sortValue: a => a.name,
      cell: (a: Audience) => (
        <span className="flex min-w-0 items-center gap-2">
          {a.is_everyone && <Globe size={13} className="shrink-0 text-text-tertiary" />}
          <span className="truncate text-text-primary">{a.name}</span>
        </span>
      ),
    },
    {
      id: 'description',
      header: t('admin.aud_description', { defaultValue: 'Description' }),
      cell: (a: Audience) => <span className="truncate text-text-secondary">{a.description ?? '—'}</span>,
    },
    {
      id: 'members',
      header: t('admin.aud_members', { defaultValue: 'Membres' }),
      align: 'right',
      sortValue: a => a.member_count,
      cell: (a: Audience) => (a.is_everyone ? '—' : a.member_count),
    },
    {
      id: 'reach',
      header: t('admin.aud_reach', { defaultValue: 'Comptes atteints' }),
      align: 'right',
      sortValue: a => a.reach,
      cell: (a: Audience) => a.reach,
    },
    {
      id: 'applied',
      header: t('admin.aud_applied', { defaultValue: 'Proposée' }),
      align: 'right',
      sortValue: a => a.applied_to,
      cell: (a: Audience) => (a.applied_to === 0
        ? <span className="text-text-tertiary">
            {t('admin.aud_not_applied', { defaultValue: 'nulle part' })}
          </span>
        : t('admin.aud_applied_n', {
            defaultValue_one: '{{count}} endroit',
            defaultValue: '{{count}} endroits',
            count: a.applied_to,
          })),
    },
  ]

  const rowActions: DataTableRowAction<Audience>[] = canManage
    ? [{
        id: 'delete',
        label: t('common.delete', { defaultValue: 'Supprimer' }),
        icon: <Trash2 size={14} />,
        danger: true,
        // The seeded audience is refused server-side; hiding the action avoids
        // offering a button whose only outcome is an error.
        hidden: a => a.is_everyone,
        onClick: a => void askRemove(a),
      }]
    : []

  const toolbar = (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Input value={q} onChange={e => setQ(e.target.value)}
             placeholder={t('admin.aud_filter_ph', { defaultValue: 'Rechercher une audience…' })}
             leftIcon={<Search size={15} />} className="w-52 pl-9" />
      {canManage && (
        <Button size="sm" icon={<Plus size={14} />} onClick={() => setCreating(true)}>
          {t('admin.aud_new', { defaultValue: 'Nouvelle audience' })}
        </Button>
      )}
    </div>
  )

  return (
    <div className="min-w-0">
      <div className="mb-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
          {t('admin.nav_audiences', { defaultValue: 'Audiences cibles' })}
        </h1>
        {data && (
          <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.aud_count', {
              defaultValue_one: '{{count}} audience',
              defaultValue: '{{count}} audiences',
              count: data.audiences.length,
            })}
          </span>
        )}
      </div>

      {/* The framing statement, first, because everything below has to be read
          inside it: an audience is a suggestion, not a permission. Somebody who
          reads this list as a list of access grants draws the wrong conclusion
          from every row. */}
      <Callout variant="info" className="mb-4"
               title={t('admin.aud_scope_title', { defaultValue: 'Une audience ne donne aucun droit' })}>
        {t('admin.aud_scope_body', {
          defaultValue: 'Ce sont des listes de destinataires proposées au moment de partager, pour que le geste rapide ne soit pas « tout le monde ». En faire partie ne donne accès à rien : la personne qui partage décide toujours.',
        })}
      </Callout>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={a => a.id}
        loading={isLoading}
        error={isError ? t('admin.aud_load_failed', { defaultValue: 'Impossible de charger les audiences.' }) : undefined}
        onRetry={() => void refetch()}
        filtered={!!q.trim()}
        onClearFilters={() => setQ('')}
        toolbar={toolbar}
        rowActions={rowActions}
        onRowClick={a => go(a.id)}
        pageSize={25}
        // Without this the table's own chrome — "Rows per page", its empty and
        // error states — stays in English while the rest of the page is not.
        t={t}
        emptyState={
          <EmptyState
            icon={<Users size={26} />}
            variant="first-use"
            title={t('admin.aud_empty', { defaultValue: 'Aucune audience' })}
            description={t('admin.aud_empty_desc', {
              defaultValue: 'Créez une audience par service ou par site, puis appliquez-la à un module pour qu’elle soit proposée.',
            })}
          />
        }
      />

      {creating && (
        <AudienceDialog
          busy={create.isPending}
          error={errMessage(create.error)}
          onCancel={() => setCreating(false)}
          onSave={v => create.mutate(v, {
            onSuccess: r => { setCreating(false); go(r.audience.id) },
          })}
        />
      )}
      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
