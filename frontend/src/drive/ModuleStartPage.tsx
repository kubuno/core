import { useMemo, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { FileText, ExternalLink, Trash2 } from 'lucide-react'
import { StartPage } from '@ui'
import type { StartPageRecentItem, StartPageTab, MenuItem } from '@ui'
import ModuleFileBrowser, { type FileContextAction, resolveRootFolder } from './ModuleFileBrowser'
import { filesApi, type FileItem } from './api'
import { FileTypeRegistry } from '@kubuno/sdk'
import { usePendingDeletionStore } from '@kubuno/sdk'
import { getDateLocale } from '@kubuno/sdk'
// StartPage « complète » : lanceur (récents) + onglet « Parcourir » alimenté PAR
// DÉFAUT par le ModuleFileBrowser (navigation des répertoires du module dans
// `files`).
//
// Les RÉCENTS sont dérivés des MÊMES fichiers que le navigateur (clé de requête
// partagée `['mbf-files', rootId, prefix]`) : ainsi, supprimer ou renommer un
// fichier se reflète automatiquement dans les récents.

export interface ModuleStartPageBrowse {
  folderPathPrefix:    string
  title:               string
  onOpenFile?:         (file: FileItem) => boolean | void
  fileTypeModuleId?:   string
  toolbarContent?:     ReactNode
  fileContextActions?: FileContextAction[]
  emptyState?:         ReactNode
  hideImport?:         boolean
  importMenuItems?:    MenuItem[]
}

export interface ModuleStartPageProps {
  recentTitle?: string
  recentIcon?:  ReactNode
  /** Récents de repli (avant résolution du dossier) — sinon dérivés des fichiers. */
  recentItems?: StartPageRecentItem[]
  recentEmpty?: ReactNode
  browse:       ModuleStartPageBrowse
  browseLabel?: string
  extraTabs?:   StartPageTab[]
  defaultTab?:  string
}

export default function ModuleStartPage({
  recentTitle, recentIcon, recentItems, recentEmpty,
  browse, browseLabel, extraTabs = [], defaultTab = 'browse',
}: ModuleStartPageProps) {
  const { t, i18n } = useTranslation('drive')
  const qc = useQueryClient()
  const pendingDel = usePendingDeletionStore(s => s.pending)

  // Dossier racine du module (ex. PaintSharp/Apex) + ses fichiers — requête PARTAGÉE
  // avec le ModuleFileBrowser (même clé) → invalidations et polling communs.
  const { data: root } = useQuery({
    queryKey: ['mbf-root', browse.folderPathPrefix],
    queryFn:  () => resolveRootFolder(browse.folderPathPrefix),
    staleTime: 60_000,
  })
  const rootId = root?.id ?? null
  const { data: filesData } = useQuery({
    queryKey: ['mbf-files', rootId, browse.folderPathPrefix],
    queryFn:  () => filesApi.listFiles(rootId),
    enabled:  !!rootId,
    refetchInterval: 3_000,
    refetchOnWindowFocus: true,
  })

  const trashMut = useMutation({
    mutationFn: (id: string) => filesApi.trashFile(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['mbf-files'] }),
  })

  const fileRecents: StartPageRecentItem[] = useMemo(() => {
    let fs = filesData?.files ?? []
    if (browse.fileTypeModuleId) fs = fs.filter(f => FileTypeRegistry.matches(browse.fileTypeModuleId!, f))
    return [...fs]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 12)
      .map(f => ({
        id:          f.id,
        name:        f.name.replace(/\.[^.]+$/, ''),
        subtitle:    format(new Date(f.updated_at), 'd MMM', { locale: getDateLocale(i18n.language) }),
        icon:        <FileText size={18} className="text-text-tertiary" strokeWidth={1.5} />,
        pendingTone: pendingDel[f.id],
        onClick:  () => { browse.onOpenFile?.(f) },
        actions: [
          { id: 'open',  label: t('common.open'),  icon: <ExternalLink size={15} />, onClick: () => { browse.onOpenFile?.(f) } },
          { id: 'trash', label: t('ctx.trash'),    icon: <Trash2 size={15} />, danger: true, onClick: () => trashMut.mutate(f.id) },
        ],
      }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesData, browse.fileTypeModuleId, i18n.language, pendingDel])

  // Récents = fichiers (une fois le dossier résolu) ; repli sur la prop avant.
  const recents = rootId ? fileRecents : (recentItems ?? [])

  const tabs: StartPageTab[] = [
    {
      id: 'browse',
      label: browseLabel ?? t('mfb.browse'),
      content: (
        <ModuleFileBrowser
          folderPathPrefix={browse.folderPathPrefix}
          title={browse.title}
          onOpenFile={browse.onOpenFile}
          fileTypeModuleId={browse.fileTypeModuleId}
          toolbarContent={browse.toolbarContent}
          fileContextActions={browse.fileContextActions}
          emptyState={browse.emptyState}
          hideImport={browse.hideImport}
          importMenuItems={browse.importMenuItems}
        />
      ),
    },
    ...extraTabs,
  ]

  return (
    <StartPage
      recentTitle={recentTitle ?? t('nav.recent')}
      recentIcon={recentIcon}
      recentItems={recents}
      recentEmpty={recentEmpty}
      tabs={tabs}
      defaultTab={defaultTab}
    />
  )
}
