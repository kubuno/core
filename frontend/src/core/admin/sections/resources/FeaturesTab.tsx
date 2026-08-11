// The equipment catalogue.
//
// The "used by" count is the whole reason this list is worth opening: a feature
// attached to nothing is a word somebody typed once and nobody can search for,
// and a feature attached to forty rooms is one nobody should rename lightly.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Sparkles } from 'lucide-react'
import {
  Button, DataTable, EmptyState,
  type DataTableColumn, type DataTableRowAction,
} from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { useConfirm } from '../../../hooks/useConfirm'
import FeatureDialog from './FeatureDialog'
import { errorMessage, useDeleteFeature, useResourceFeatures, type ResourceFeature } from './api'

export default function FeaturesTab({ canManage }: { canManage: boolean }) {
  const { t } = useTranslation()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const [editing, setEditing] = useState<ResourceFeature | 'new' | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useResourceFeatures()
  const remove = useDeleteFeature()

  const columns: DataTableColumn<ResourceFeature>[] = [
    {
      id: 'name',
      header: t('admin.res_feature_name'),
      primary: true,
      minWidth: 200,
      sortValue: r => r.name.toLowerCase(),
      cell: r => <span className="text-text-primary">{r.name}</span>,
    },
    {
      id: 'description',
      header: t('admin.res_admin_note'),
      minWidth: 260,
      sortValue: r => (r.description ?? '').toLowerCase(),
      cell: r => (
        <span className="text-text-secondary">{r.description ?? '—'}</span>
      ),
    },
    {
      id: 'resource_count',
      header: t('admin.res_col_used_by'),
      align: 'right',
      sortValue: r => r.resource_count,
      cell: r => (
        <span className={r.resource_count === 0 ? 'text-text-tertiary' : 'text-text-secondary'}>
          {r.resource_count}
        </span>
      ),
    },
  ]

  const rowActions: DataTableRowAction<ResourceFeature>[] = canManage
    ? [
        { id: 'edit', label: t('admin.res_action_edit'), onClick: r => setEditing(r) },
        {
          id: 'delete',
          label: t('admin.res_action_delete'),
          danger: true,
          onClick: async r => {
            const ok = await confirm({
              title: t('admin.res_feature_delete_title'),
              // The count is in the sentence because deleting a feature is
              // allowed even while resources carry it: it silently shortens
              // their composed names, and that is worth saying first.
              message: r.resource_count > 0
                ? t('admin.res_feature_delete_used', { name: r.name, count: r.resource_count })
                : t('admin.res_feature_delete_message', { name: r.name }),
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
        rows={data?.features ?? []}
        columns={columns}
        rowKey={r => r.id}
        loading={isLoading}
        error={isError ? t('admin.res_load_failed') : undefined}
        onRetry={() => void refetch()}
        rowActions={rowActions}
        onRowClick={canManage ? r => setEditing(r) : undefined}
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
              {t('admin.res_feature_new')}
            </Button>
          )
          : undefined}
        emptyState={(
          <EmptyState
            icon={<Sparkles size={26} />}
            variant="first-use"
            title={t('admin.res_features_empty_title')}
            description={t('admin.res_features_empty_desc')}
            action={canManage
              ? { label: t('admin.res_feature_new'), onClick: () => setEditing('new') }
              : undefined}
            t={t}
          />
        )}
      />

      {editing && (
        <FeatureDialog
          feature={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
