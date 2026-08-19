import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Package } from 'lucide-react'
import { Badge, Card, DataTable, type DataTableColumn } from '@ui'
import { formatDay } from '../format'
import { ExternalLink } from './Field'
import type { InstalledModule } from './api'

/**
 * What is installed, at which version, under which licence.
 *
 * The licence column is not decoration: a module is a separate repository with
 * its own manifest, so "the platform is AGPL" is a statement about the core and
 * nothing more. What each module declares is read back from `core.modules`,
 * where the manifest it shipped landed — so a module that ever declares
 * something else shows it here rather than being quietly assumed to match.
 *
 * The version column is the other half of a support request: "which version"
 * is the first question anybody answering one asks.
 */
export default function ModulesLicenceCard({ modules }: { modules: InstalledModule[] }) {
  const { t, i18n } = useTranslation()

  const columns = useMemo<DataTableColumn<InstalledModule>[]>(() => [
    {
      id: 'name',
      header: t('admin.sub_mod_col_name'),
      primary: true,
      required: true,
      sortValue: r => r.display_name,
      cell: r => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-text-primary">{r.display_name}</span>
          <span className="truncate font-mono text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {r.id}
          </span>
        </span>
      ),
    },
    {
      id: 'version',
      header: t('admin.sub_mod_col_version'),
      sortValue: r => r.version,
      cell: r => <span className="tabular-nums">{r.version}</span>,
    },
    {
      id: 'licence',
      header: t('admin.sub_mod_col_licence'),
      sortValue: r => r.license ?? '',
      // A module that declares nothing is shown as declaring nothing. Filling
      // the gap with the core's own licence would be the console asserting
      // something the module never said.
      cell: r => r.license
        ? <Badge variant="default">{r.license}</Badge>
        : <span className="text-text-tertiary">{t('admin.sub_mod_licence_unknown')}</span>,
    },
    {
      id: 'state',
      header: t('admin.sub_mod_col_state'),
      sortValue: r => r.is_enabled,
      cell: r => r.is_enabled
        ? <span className="text-text-secondary">{t('admin.sub_mod_enabled')}</span>
        : <span className="text-text-tertiary">{t('admin.sub_mod_disabled')}</span>,
    },
    {
      id: 'installed',
      header: t('admin.sub_mod_col_installed'),
      sortValue: r => r.installed_at,
      cell: r => (
        <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {formatDay(r.installed_at, i18n.language)}
        </span>
      ),
    },
    {
      id: 'source',
      header: t('admin.sub_mod_col_source'),
      cell: r => r.homepage_url
        ? <ExternalLink href={r.homepage_url}>{t('admin.sub_mod_source_link')}</ExternalLink>
        : <span className="text-text-tertiary">—</span>,
    },
  ], [t, i18n.language])

  return (
    <Card
      title={t('admin.sub_modules_title')}
      icon={<Package size={16} />}
      subtitle={t('admin.sub_modules_subtitle')}
      flush
    >
      <DataTable
        rows={modules}
        columns={columns}
        rowKey={r => r.id}
        defaultSort={{ columnId: 'name', direction: 'asc' }}
        pageSize={0}
        t={t}
      />
    </Card>
  )
}
