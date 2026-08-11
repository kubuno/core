// Content detectors — the list.
//
// The screen answers one question at a glance: what is this instance looking
// for, and is it actually looking. A disabled detector is the single most
// consequential state here — a rule that names it is stored, armed, and inert —
// so it is a column rather than a detail somebody finds by opening the sheet.

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, ShieldCheck, ShieldOff, SearchCheck } from 'lucide-react'
import {
  Button, DataTable, EmptyState,
  type DataTableColumn, type DataTableRowAction,
} from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { useConfirm } from '../../hooks/useConfirm'
import { PRIV } from '../../authz/types'
import { usePrivileges } from '../../authz/usePrivileges'
import { adminUrl, useAdminAction } from '../adminAction'
import type { AdminSectionProps } from '../sections/registry'
import { useDetectors, useDeleteDetector, errorMessage, type Detector } from './api'
import { asPercent, categoryLabel, categoryOrder, checksumLabel, kindLabel } from './labels'
import DetectorEditor from './DetectorEditor'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function DetectorsSection({ params, navigate }: AdminSectionProps) {
  const { t }   = useTranslation()
  const { can } = usePrivileges()
  const canManage = can(PRIV.RULES_MANAGE)
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useDetectors()
  const remove = useDeleteDetector()

  // `/admin/detectors?action=create` from anywhere in the console.
  useAdminAction('create', () => { if (canManage) setEditing('new') })

  // `/admin/detectors?detector=…` accepts a row id OR a catalogue key: a rule's
  // detector leaf names the KEY (a rule read three years later must still say
  // what it looked for), so the rules console can only link here by key. An
  // unknown key — or a list still loading — falls back to the catalogue rather
  // than sending a non-uuid into `GET /admin/detectors/:id`.
  const openParam = params.get('detector')
  const openId = useMemo(() => {
    if (!openParam) return null
    if (UUID_RE.test(openParam)) return openParam
    return (data?.detectors ?? []).find(d => d.key === openParam)?.id ?? null
  }, [openParam, data])
  const active = editing ?? openId

  const rows = useMemo(() => {
    const list = data?.detectors ?? []
    return [...list].sort((a, b) =>
      categoryOrder(a.category) - categoryOrder(b.category) ||
      a.label.localeCompare(b.label))
  }, [data])

  if (active) {
    return (
      <DetectorEditor
        id={active === 'new' ? null : active}
        limits={data?.limits}
        onClose={() => {
          setEditing(null)
          if (openId) navigate(adminUrl({ tab: 'detectors' }))
        }}
      />
    )
  }

  const columns: DataTableColumn<Detector>[] = [
    {
      id: 'label',
      header: t('admin.det_col_detector'),
      primary: true,
      minWidth: 220,
      sortValue: r => r.label,
      cell: r => (
        <div className="min-w-0">
          <div className="truncate text-text-primary">{r.label}</div>
          <div className="truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {r.key}
          </div>
        </div>
      ),
    },
    {
      id: 'category',
      header: t('admin.det_col_category'),
      sortValue: r => categoryOrder(r.category),
      cell: r => <span className="text-text-secondary">{categoryLabel(t, r.category)}</span>,
    },
    {
      id: 'kind',
      header: t('admin.det_col_kind'),
      sortValue: r => r.kind,
      cell: r => (
        <span className="text-text-secondary">
          {kindLabel(t, r.kind)}
          {r.checksum ? ` · ${checksumLabel(t, r.checksum)}` : ''}
        </span>
      ),
    },
    {
      id: 'thresholds',
      header: t('admin.det_col_thresholds'),
      minWidth: 200,
      cell: r => (
        <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.det_thresholds_summary', {
            confidence: asPercent(r.min_confidence),
            matches: r.min_matches,
            unique: r.min_unique_matches,
          })}
        </span>
      ),
    },
    {
      id: 'state',
      header: t('admin.det_col_state'),
      sortValue: r => (r.is_enabled ? 0 : 1),
      cell: r => (
        <span className="inline-flex items-center gap-1.5">
          {r.is_enabled
            ? <ShieldCheck size={14} className="text-success" aria-hidden />
            : <ShieldOff size={14} className="text-text-tertiary" aria-hidden />}
          <span className={r.is_enabled ? 'text-text-secondary' : 'text-text-tertiary'}>
            {r.is_enabled ? t('admin.det_state_on') : t('admin.det_state_off')}
          </span>
        </span>
      ),
    },
    {
      id: 'origin',
      header: t('admin.det_col_origin'),
      defaultHidden: true,
      sortValue: r => (r.is_builtin ? 0 : 1),
      cell: r => (
        <span className="text-text-tertiary">
          {r.is_builtin ? t('admin.det_origin_builtin') : t('admin.det_origin_custom')}
        </span>
      ),
    },
  ]

  const rowActions: DataTableRowAction<Detector>[] = canManage
    ? [
        {
          id: 'edit',
          label: t('admin.det_action_edit'),
          onClick: r => setEditing(r.id),
        },
        {
          id: 'delete',
          label: t('admin.det_action_delete'),
          danger: true,
          hidden: r => r.is_builtin,
          onClick: async r => {
            const ok = await confirm({
              title: t('admin.det_delete_title'),
              message: t('admin.det_delete_message', { label: r.label }),
              confirmLabel: t('admin.det_action_delete'),
              variant: 'danger',
            })
            if (!ok) return
            setError(null)
            try {
              await remove.mutateAsync(r.id)
            } catch (e) {
              setError(errorMessage(e, t('admin.det_delete_failed')))
            }
          },
        },
      ]
    : []

  return (
    <div className="min-w-0">
      <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
        {t('admin.det_title')}
      </h1>
      <p className="mt-1 max-w-3xl text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
        {t('admin.det_intro')}
      </p>

      {error && (
        <p className="mt-3 text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>
          {error}
        </p>
      )}

      <div className="mt-4">
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={r => r.id}
          loading={isLoading}
          error={isError ? t('admin.det_load_failed') : undefined}
          onRetry={() => void refetch()}
          rowActions={rowActions}
          onRowClick={r => setEditing(r.id)}
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
                {t('admin.det_new')}
              </Button>
            )
            : undefined}
          emptyState={(
            <EmptyState
              icon={<SearchCheck size={26} />}
              variant="first-use"
              title={t('admin.det_empty_title')}
              description={t('admin.det_empty_desc')}
              action={canManage
                ? { label: t('admin.det_new'), onClick: () => setEditing('new') }
                : undefined}
              t={t}
            />
          )}
        />
      </div>

      {confirmState && (
        <ConfirmDialog
          {...confirmState}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
