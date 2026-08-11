// The buildings inventory.
//
// The floor list is a column rather than a detail behind a click: it is the
// field every resource depends on, and "this building has no 3rd floor" is the
// answer to most of the refusals the resource form produces.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Plus } from 'lucide-react'
import {
  Button, DataTable, EmptyState,
  type DataTableColumn, type DataTableRowAction,
} from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { useConfirm } from '../../../hooks/useConfirm'
import BuildingDialog from './BuildingDialog'
import { errorMessage, useBuildings, useDeleteBuilding, type Building } from './api'

export default function BuildingsTab({ canManage }: { canManage: boolean }) {
  const { t } = useTranslation()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const [editing, setEditing] = useState<Building | 'new' | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useBuildings()
  const remove = useDeleteBuilding()

  const rows = data?.buildings ?? []

  const columns: DataTableColumn<Building>[] = [
    {
      id: 'building_key',
      header: t('admin.res_building_key'),
      primary: true,
      minWidth: 200,
      sortValue: r => r.building_key.toLowerCase(),
      cell: r => (
        <div className="min-w-0">
          <div className="truncate text-text-primary">{r.building_key}</div>
          {r.name && (
            <div className="truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {r.name}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'address',
      header: t('admin.res_address'),
      minWidth: 220,
      sortValue: r => r.address.toLowerCase(),
      cell: r => <span className="text-text-secondary">{r.address}</span>,
    },
    {
      id: 'floors',
      header: t('admin.res_floors'),
      minWidth: 180,
      // Sorted by how many, not alphabetically: the order of the list itself is
      // meaningful and must be read as written, never re-sorted for display.
      sortValue: r => r.floors.length,
      cell: r => (
        <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {r.floors.join(' · ')}
        </span>
      ),
    },
    {
      id: 'resource_count',
      header: t('admin.res_col_resources'),
      align: 'right',
      sortValue: r => r.resource_count,
      cell: r => <span className="text-text-secondary">{r.resource_count}</span>,
    },
  ]

  const rowActions: DataTableRowAction<Building>[] = canManage
    ? [
        { id: 'edit', label: t('admin.res_action_edit'), onClick: r => setEditing(r) },
        {
          id: 'delete',
          label: t('admin.res_action_delete'),
          danger: true,
          onClick: async r => {
            const ok = await confirm({
              title: t('admin.res_building_delete_title'),
              message: t('admin.res_building_delete_message', { key: r.building_key }),
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
        rows={rows}
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
              {t('admin.res_building_new')}
            </Button>
          )
          : undefined}
        emptyState={(
          <EmptyState
            icon={<Building2 size={26} />}
            variant="first-use"
            title={t('admin.res_buildings_empty_title')}
            description={t('admin.res_buildings_empty_desc')}
            action={canManage
              ? { label: t('admin.res_building_new'), onClick: () => setEditing('new') }
              : undefined}
            t={t}
          />
        )}
      />

      {editing && (
        <BuildingDialog
          building={editing === 'new' ? null : editing}
          floorMax={data?.limits.floors ?? 200}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
