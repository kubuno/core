// Which accounts one export covered, and what each of them actually produced.
//
// ## Why this is a separate read, and a separate card
//
// An instance-wide export has thousands of subjects and the history opens on
// thirty runs; carrying the accounts inside every row would make the page's
// first paint proportional to the largest export ever taken.
//
// It matters more than a detail view usually does. After an incident the
// question is never "was there an export" — the history answers that — it is
// **"whose data was in it"**, and a list that is queryable is the difference
// between an answer and an afternoon. It is also where a partial export becomes
// legible: `services_ko` says which service could not answer for which account,
// which is exactly what the person receiving the archive has to be told before
// they rely on it.

import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import {
  Badge, Button, Card, DataTable, EmptyState, Spinner,
  type DataTableColumn,
} from '@ui'
import { formatBytes } from '../format'
import { useExportSubjects, type ExportSubject } from './api'

const STATUS_SKIN: Record<string, 'neutral' | 'success' | 'warning' | 'danger'> = {
  pending: 'neutral',
  done:    'success',
  partial: 'warning',
  failed:  'danger',
}

export default function ExportSubjectsCard({ exportId, onClose }: {
  exportId: string
  onClose:  () => void
}) {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useExportSubjects(exportId)

  const columns: DataTableColumn<ExportSubject>[] = [
    {
      id: 'account',
      header: t('admin.dx_sub_col_account'),
      primary: true,
      minWidth: 220,
      sortValue: r => r.user_label,
      cell: r => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-text-primary">{r.user_label}</span>
          <span className="truncate font-mono text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            comptes/{r.folder}
          </span>
        </span>
      ),
    },
    {
      id: 'status',
      header: t('admin.dx_sub_col_status'),
      minWidth: 120,
      sortValue: r => r.status,
      cell: r => (
        <Badge variant={STATUS_SKIN[r.status] ?? 'neutral'}>
          {t(`admin.dx_sub_status_${r.status}`, { defaultValue: r.status })}
        </Badge>
      ),
    },
    {
      id: 'services',
      header: t('admin.dx_sub_col_services'),
      minWidth: 240,
      cell: r => (
        <span className="flex min-w-0 flex-wrap gap-1">
          {r.services_ok.map(s => (
            <Badge key={`ok-${s}`} variant="success" size="sm">{s}</Badge>
          ))}
          {r.services_ko.map(s => (
            // Absent, not failed: the archive simply has no folder for it, and
            // saying which one is the whole point of showing this column.
            <Badge key={`ko-${s}`} variant="warning" size="sm">{s}</Badge>
          ))}
          {r.services_ok.length === 0 && r.services_ko.length === 0 && (
            <span className="text-text-tertiary">—</span>
          )}
        </span>
      ),
    },
    {
      id: 'size',
      header: t('admin.dx_sub_col_size'),
      align: 'right',
      minWidth: 100,
      sortValue: r => r.size_bytes ?? -1,
      cell: r => (r.size_bytes == null ? '—' : formatBytes(r.size_bytes)),
    },
    {
      id: 'error',
      header: t('admin.dx_sub_col_notes'),
      minWidth: 260,
      defaultHidden: true,
      cell: r => (
        <span className="min-w-0 break-words text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {r.error ?? '—'}
        </span>
      ),
    },
  ]

  return (
    <Card
      className="mt-4"
      flush
      title={t('admin.dx_sub_title')}
      subtitle={t('admin.dx_sub_desc')}
      actions={(
        <Button size="sm" variant="ghost" icon={<X size={15} />} onClick={onClose}>
          {t('common.close')}
        </Button>
      )}
    >
      {isLoading && <div className="flex justify-center py-10"><Spinner /></div>}
      {!isLoading && (isError || !data) && (
        <div className="p-4">
          <EmptyState
            icon={<X size={26} />}
            variant="error"
            title={t('admin.dx_sub_failed')}
            action={{ label: t('admin.dx_retry'), onClick: () => void refetch() }}
            compact
            t={t}
          />
        </div>
      )}
      {!isLoading && data && (
        <DataTable
          rows={data}
          columns={columns}
          rowKey={r => r.id}
          defaultSort={null}
          pageSize={25}
          minTableWidth={820}
          configurableColumns
          t={t}
          emptyState={(
            <EmptyState
              icon={<X size={26} />}
              title={t('admin.dx_sub_empty')}
              compact
              t={t}
            />
          )}
        />
      )}
    </Card>
  )
}
