// The resources inventory.
//
// The composed name is the primary column, not the typed one: it is the string
// people see when they book, so a table sorted and searched on anything else
// would be a table that disagrees with everybody's experience of the same room.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarRange, Plus } from 'lucide-react'
import {
  Button, DataTable, EmptyState,
  type DataTableColumn, type DataTableRowAction,
} from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { useConfirm } from '../../../hooks/useConfirm'
import ResourceDialog from './ResourceDialog'
import { errorMessage, useDeleteResource, useResources, type Resource } from './api'

export default function ResourcesTab({ canManage }: { canManage: boolean }) {
  const { t } = useTranslation()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const [editing, setEditing] = useState<Resource | 'new' | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useResources()
  const remove = useDeleteResource()

  const columns: DataTableColumn<Resource>[] = [
    {
      id: 'generated_name',
      header: t('admin.res_generated_name'),
      primary: true,
      minWidth: 260,
      sortValue: r => r.generated_name.toLowerCase(),
      cell: r => (
        <div className="min-w-0">
          <div className="truncate text-text-primary">{r.generated_name}</div>
          <div className="truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {r.name}
          </div>
        </div>
      ),
    },
    {
      id: 'category',
      header: t('admin.res_category'),
      sortValue: r => (r.category === 'meeting_room' ? 0 : 1),
      cell: r => (
        <span className="text-text-secondary">
          {r.category === 'meeting_room'
            ? t('admin.res_category_room')
            : r.resource_type ?? t('admin.res_category_other')}
        </span>
      ),
    },
    {
      id: 'building',
      header: t('admin.res_building'),
      minWidth: 160,
      sortValue: r => r.building.key.toLowerCase(),
      cell: r => (
        <span className="text-text-secondary">
          {r.building.name ?? r.building.key}
        </span>
      ),
    },
    {
      id: 'floor',
      header: t('admin.res_floor'),
      sortValue: r => r.floor_name.toLowerCase(),
      cell: r => (
        <span className="text-text-secondary">
          {r.floor_section ? `${r.floor_name} · ${r.floor_section}` : r.floor_name}
        </span>
      ),
    },
    {
      id: 'capacity',
      header: t('admin.res_capacity'),
      align: 'right',
      sortValue: r => r.capacity,
      cell: r => <span className="text-text-secondary">{r.capacity}</span>,
    },
    {
      id: 'features',
      header: t('admin.res_features'),
      minWidth: 180,
      defaultHidden: true,
      sortValue: r => r.feature_names.length,
      cell: r => (
        <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {r.feature_names.length > 0 ? r.feature_names.join(' · ') : '—'}
        </span>
      ),
    },
  ]

  const rowActions: DataTableRowAction<Resource>[] = canManage
    ? [
        { id: 'edit', label: t('admin.res_action_edit'), onClick: r => setEditing(r) },
        {
          id: 'delete',
          label: t('admin.res_action_delete'),
          danger: true,
          onClick: async r => {
            const ok = await confirm({
              title: t('admin.res_resource_delete_title'),
              message: t('admin.res_resource_delete_message', { name: r.generated_name }),
              confirmLabel: t('admin.res_action_delete'),
              variant: 'danger',
            })
            if (!ok) return
            setError(null)
            try {
              await remove.mutateAsync(r.id)
            } catch (e) {
              setError(errorMessage(e, t('admin.res_delete_failed')))
            }
          },
        },
      ]
    : []

  return (
    <div className="min-w-0">
      {error && (
        <p className="mb-3 text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>
          {error}
        </p>
      )}

      <DataTable
        rows={data?.resources ?? []}
        columns={columns}
        rowKey={r => r.id}
        loading={isLoading}
        error={isError ? t('admin.res_load_failed') : undefined}
        onRetry={() => void refetch()}
        rowActions={rowActions}
        onRowClick={canManage ? r => setEditing(r) : undefined}
        configurableColumns
        pageSize={0}
        t={t}
        toolbar={canManage
          ? (
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setEditing('new')}
            >
              {t('admin.res_resource_new')}
            </Button>
          )
          : undefined}
        emptyState={(
          <EmptyState
            icon={<CalendarRange size={26} />}
            variant="first-use"
            title={t('admin.res_resources_empty_title')}
            description={t('admin.res_resources_empty_desc')}
            action={canManage
              ? { label: t('admin.res_resource_new'), onClick: () => setEditing('new') }
              : undefined}
            t={t}
          />
        )}
      />

      {editing && (
        <ResourceDialog
          resource={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
