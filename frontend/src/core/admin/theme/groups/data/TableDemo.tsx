import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Card, DataTable, Input, ProgressBar, type DataTableColumn } from '@ui'
import { Ban, Mail, Pencil, Search, Shield, Trash2, UserMinus } from 'lucide-react'
import { DEMO_MEMBERS, formatBytes, formatDate, type DemoMember } from './fixtures'

/**
 * The DataTable exercised on real-ish data: sorting, pagination, multi-select
 * with bulk actions, a column chooser, and the loading/error/empty states.
 *
 * The search field is the CALLER's (a table does not own its filters); it is
 * wired to `filtered` so the table picks the "no result" empty state — with a
 * "clear the filters" way out — instead of the "nothing yet" one.
 */
export default function TableDemo() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [state, setState] = useState<'data' | 'loading' | 'error' | 'empty'>('data')

  const rows = useMemo(() => {
    if (state === 'empty') return []
    const q = query.trim().toLowerCase()
    if (!q) return DEMO_MEMBERS
    return DEMO_MEMBERS.filter(m =>
      m.name.toLowerCase().includes(q) || m.email.includes(q) || m.unit.toLowerCase().includes(q))
  }, [query, state])

  const columns = useMemo<DataTableColumn<DemoMember>[]>(() => [
    {
      id: 'name',
      header: t('admin.t_prev_dt_col_member', { defaultValue: 'Membre' }),
      primary: true,
      required: true,
      minWidth: 200,
      sortValue: m => m.name,
      cell: m => (
        <div className="min-w-0">
          <div className="truncate text-text-primary">{m.name}</div>
          <div className="truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>{m.email}</div>
        </div>
      ),
    },
    {
      id: 'unit',
      header: t('admin.t_prev_dt_col_unit', { defaultValue: 'Unité' }),
      sortValue: m => m.unit,
      cell: m => <span className="truncate">{m.unit}</span>,
    },
    {
      id: 'role',
      header: t('admin.t_prev_dt_col_role', { defaultValue: 'Rôle' }),
      sortValue: m => m.role,
      cell: m => (
        <Badge variant={m.role === 'admin' ? 'primary' : m.role === 'guest' ? 'default' : 'neutral'}>
          {m.role}
        </Badge>
      ),
    },
    {
      id: 'quota',
      header: t('admin.t_prev_dt_col_quota', { defaultValue: 'Quota' }),
      minWidth: 150,
      sortValue: m => m.quota / m.max,
      cell: m => (
        <ProgressBar
          t={t}
          size="sm"
          value={m.quota}
          max={m.max}
          label={formatBytes(m.quota)}
          showValue
        />
      ),
    },
    {
      id: 'lastSeen',
      header: t('admin.t_prev_dt_col_seen', { defaultValue: 'Dernière activité' }),
      align: 'right',
      sortValue: m => m.lastSeen,
      cell: m => <span className="tabular-nums text-text-secondary">{formatDate(m.lastSeen)}</span>,
    },
    {
      id: 'status',
      header: t('admin.t_prev_dt_col_status', { defaultValue: 'Statut' }),
      defaultHidden: true,
      sortValue: m => m.active,
      cell: m => (
        <Badge dot variant={m.active ? 'success' : 'default'}>
          {m.active
            ? t('admin.t_prev_dt_active', { defaultValue: 'Actif' })
            : t('admin.t_prev_dt_suspended', { defaultValue: 'Suspendu' })}
        </Badge>
      ),
    },
  ], [t])

  const STATES: Array<{ id: typeof state; label: string }> = [
    { id: 'data',    label: t('admin.t_prev_dt_s_data',    { defaultValue: 'Données' }) },
    { id: 'loading', label: t('admin.t_prev_dt_s_loading', { defaultValue: 'Chargement' }) },
    { id: 'error',   label: t('admin.t_prev_dt_s_error',   { defaultValue: 'Erreur' }) },
    { id: 'empty',   label: t('admin.t_prev_dt_s_empty',   { defaultValue: 'Vide' }) },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.t_prev_dt_state', { defaultValue: 'État :' })}
        </span>
        {STATES.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setState(s.id)}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              state === s.id ? 'bg-primary-light text-primary' : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
            }`}
            style={{ fontSize: 'var(--kb-text-meta)' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <DataTable<DemoMember>
        t={t}
        rows={rows}
        columns={columns}
        rowKey={m => m.id}
        title={t('admin.t_prev_dt_title', { defaultValue: 'Membres de l’organisation' })}
        loading={state === 'loading'}
        error={state === 'error'
          ? t('admin.t_prev_dt_err', { defaultValue: 'Le service d’annuaire n’a pas répondu (504).' })
          : undefined}
        onRetry={() => setState('data')}
        filtered={query.trim().length > 0}
        onClearFilters={() => setQuery('')}
        defaultSort={{ columnId: 'name', direction: 'asc' }}
        pageSize={10}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        configurableColumns
        toolbar={(
          <div className="max-w-64">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              leftIcon={<Search size={14} />}
              placeholder={t('admin.t_prev_dt_search', { defaultValue: 'Filtrer les membres…' })}
              aria-label={t('admin.t_prev_dt_search', { defaultValue: 'Filtrer les membres…' })}
            />
          </div>
        )}
        bulkActions={[
          { id: 'mail',    label: t('admin.t_prev_dt_b_mail',    { defaultValue: 'Envoyer un message' }), icon: <Mail size={14} />,      onClick: () => setSelected([]) },
          { id: 'role',    label: t('admin.t_prev_dt_b_role',    { defaultValue: 'Changer de rôle' }),    icon: <Shield size={14} />,    onClick: () => setSelected([]) },
          { id: 'suspend', label: t('admin.t_prev_dt_b_suspend', { defaultValue: 'Suspendre' }),          icon: <Ban size={14} />,       onClick: () => setSelected([]) },
          { id: 'remove',  label: t('admin.t_prev_dt_b_remove',  { defaultValue: 'Retirer de l’unité' }), icon: <UserMinus size={14} />, onClick: () => setSelected([]) },
          { id: 'delete',  label: t('common.delete', { defaultValue: 'Supprimer' }), icon: <Trash2 size={14} />, danger: true, onClick: () => setSelected([]) },
        ]}
        rowActions={[
          { id: 'edit',   label: t('admin.t_prev_dt_a_edit',  { defaultValue: 'Modifier' }), icon: <Pencil size={14} />, onClick: () => {} },
          { id: 'mail',   label: t('admin.t_prev_dt_b_mail',  { defaultValue: 'Envoyer un message' }), icon: <Mail size={14} />, onClick: () => {} },
          { id: 'delete', label: t('common.delete', { defaultValue: 'Supprimer' }), icon: <Trash2 size={14} />, danger: true, onClick: () => {} },
        ]}
      />

      <Card
        dense
        title={t('admin.t_prev_card_title', { defaultValue: 'Carte' })}
        icon={<Shield size={15} />}
        actions={<Badge variant="success">{t('admin.t_prev_card_ok', { defaultValue: 'Conforme' })}</Badge>}
        footer={(
          <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.t_prev_card_footer', { defaultValue: 'Pied de carte — totaux, actions secondaires.' })}
          </p>
        )}
      >
        <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('admin.t_prev_card_body', {
            defaultValue: 'Conteneur unique des blocs titrés de l’administration : en-tête (icône, titre, actions), corps, pied.',
          })}
        </p>
      </Card>
    </div>
  )
}
