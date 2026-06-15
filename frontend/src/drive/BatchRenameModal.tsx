import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { FileText, Folder as FolderIcon, FolderTree, Loader2, ArrowRight } from 'lucide-react'
import { FloatingWindow } from '@ui'
import { Button, Input, Dropdown, Checkbox } from '@ui'
import { filesApi } from './api'

// Renommage en lot façon PowerRename : recherche (regex ou littérale) → remplacement,
// portée (nom / extension), casse, inclusion fichiers/dossiers/sous-dossiers,
// mise en forme de casse, jeton ${counter}, aperçu en direct.

export interface BatchRenameItem {
  id:   string
  name: string
  type: 'file' | 'folder'
}

interface Props {
  items:   BatchRenameItem[]
  onClose: () => void
}

type ApplyTo  = 'both' | 'name' | 'ext'
type CaseMode = 'none' | 'lower' | 'upper' | 'title' | 'capitalize'

function splitNameExt(name: string, isFolder: boolean): { base: string; ext: string } {
  if (isFolder) return { base: name, ext: '' }
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return { base: name, ext: '' }
  return { base: name.slice(0, dot), ext: name.slice(dot + 1) }
}

function applyCaseMode(s: string, mode: CaseMode): string {
  switch (mode) {
    case 'lower':      return s.toLowerCase()
    case 'upper':      return s.toUpperCase()
    case 'title':      return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s
    case 'capitalize': return s.replace(/(^|\s|[-_.])(\p{L})/gu, (_m, sep, c) => sep + c.toUpperCase())
    default:           return s
  }
}

// Remplacement littéral (toutes occurrences ou première), sensible/insensible à la casse.
function literalReplace(input: string, search: string, repl: string, all: boolean, caseSensitive: boolean): string {
  if (!search) return input
  if (caseSensitive) {
    return all ? input.split(search).join(repl) : input.replace(search, repl)
  }
  // insensible à la casse : regex échappée
  const esc = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return input.replace(new RegExp(esc, all ? 'gi' : 'i'), repl)
}

interface Opts {
  search: string; replace: string; regex: boolean; matchAll: boolean
  caseSensitive: boolean; applyTo: ApplyTo; caseMode: CaseMode
}

function transform(part: string, opts: Opts, index: number): string {
  let out = part
  if (opts.search) {
    if (opts.regex) {
      try {
        const flags = (opts.matchAll ? 'g' : '') + (opts.caseSensitive ? '' : 'i')
        out = part.replace(new RegExp(opts.search, flags), opts.replace)
      } catch {
        return part // regex invalide → pas de changement
      }
    } else {
      out = literalReplace(part, opts.search, opts.replace, opts.matchAll, opts.caseSensitive)
    }
  } else if (opts.replace) {
    // Pas de recherche mais un remplacement : on remplace tout le nom (utile avec ${counter}).
    out = opts.replace
  }
  // Jeton d'énumération ${counter} / ${counter:N}
  out = out.replace(/\$\{counter(?::(\d+))?\}/g, (_m, pad) => {
    const n = String(index + 1)
    return pad ? n.padStart(Number(pad), '0') : n
  })
  return applyCaseMode(out, opts.caseMode)
}

function computeNewName(item: BatchRenameItem, index: number, opts: Opts): string {
  const { base, ext } = splitNameExt(item.name, item.type === 'folder')
  const hasExt = ext.length > 0
  if (opts.applyTo === 'name') {
    const nb = transform(base, opts, index)
    return hasExt ? `${nb}.${ext}` : nb
  }
  if (opts.applyTo === 'ext') {
    if (!hasExt) return item.name
    return `${base}.${transform(ext, opts, index)}`
  }
  return transform(item.name, opts, index)
}

export default function BatchRenameModal({ items, onClose }: Props) {
  const { t } = useTranslation('drive')
  const qc = useQueryClient()

  const [search, setSearch]               = useState('')
  const [replace, setReplace]             = useState('')
  const [regex, setRegex]                 = useState(true)
  const [matchAll, setMatchAll]           = useState(true)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [applyTo, setApplyTo]             = useState<ApplyTo>('both')
  const [incFiles, setIncFiles]           = useState(true)
  const [incFolders, setIncFolders]       = useState(true)
  const [incSub, setIncSub]               = useState(false)
  const [caseMode, setCaseMode]           = useState<CaseMode>('none')

  const [descendants, setDescendants] = useState<BatchRenameItem[]>([])
  const [loadingSub, setLoadingSub]   = useState(false)
  const [progress, setProgress]       = useState<{ done: number; total: number } | null>(null)

  // ── Récursion sous-dossiers ────────────────────────────────────────────────
  useEffect(() => {
    if (!incSub) { setDescendants([]); return }
    const folderIds = items.filter(i => i.type === 'folder').map(i => i.id)
    if (folderIds.length === 0) { setDescendants([]); return }
    let cancelled = false
    setLoadingSub(true)
    ;(async () => {
      const acc: BatchRenameItem[] = []
      const visit = async (fid: string) => {
        const [sf, ff] = await Promise.all([filesApi.listFolders(fid), filesApi.listFiles(fid)])
        for (const f of sf.folders) { acc.push({ id: f.id, name: f.name, type: 'folder' }); await visit(f.id) }
        for (const f of ff.files)   { acc.push({ id: f.id, name: f.name, type: 'file' }) }
      }
      try { for (const fid of folderIds) await visit(fid) } catch { /* ignore */ }
      if (!cancelled) { setDescendants(acc); setLoadingSub(false) }
    })()
    return () => { cancelled = true }
  }, [incSub, items])

  // ── Ensemble de travail (filtré par type) ──────────────────────────────────
  const workingSet = useMemo(() => {
    const all = [...items, ...(incSub ? descendants : [])]
    const seen = new Set<string>()
    return all.filter(i => {
      if (seen.has(i.id)) return false
      seen.add(i.id)
      if (i.type === 'file'   && !incFiles)   return false
      if (i.type === 'folder' && !incFolders) return false
      return true
    })
  }, [items, descendants, incSub, incFiles, incFolders])

  const opts: Opts = { search, replace, regex, matchAll, caseSensitive, applyTo, caseMode }
  const previews = useMemo(
    () => workingSet.map((item, i) => {
      const next = computeNewName(item, i, opts)
      return { item, next, changed: next !== item.name && next.trim().length > 0 }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workingSet, search, replace, regex, matchAll, caseSensitive, applyTo, caseMode],
  )
  const changedCount = previews.filter(p => p.changed).length

  const apply = async () => {
    const toRename = previews.filter(p => p.changed)
    if (toRename.length === 0) return
    setProgress({ done: 0, total: toRename.length })
    for (let i = 0; i < toRename.length; i++) {
      const { item, next } = toRename[i]
      try {
        if (item.type === 'folder') await filesApi.renameFolder(item.id, next.slice(0, 255), false, false)
        else                        await filesApi.renameFile(item.id, next.slice(0, 255), false, false)
      } catch { /* on continue malgré un échec ponctuel */ }
      setProgress({ done: i + 1, total: toRename.length })
    }
    qc.invalidateQueries({ queryKey: ['files'] })
    qc.invalidateQueries({ queryKey: ['folders'] })
    qc.invalidateQueries({ queryKey: ['tree-children'] })
    onClose()
  }

  const applying = progress !== null

  // ── UI ─────────────────────────────────────────────────────────────────────
  const Check = ({ v, set, label }: { v: boolean; set: (b: boolean) => void; label: string }) => (
    <Checkbox checked={v} onChange={set} label={label} />
  )
  const IncBtn = ({ on, set, icon, title }: { on: boolean; set: (b: boolean) => void; icon: ReactNode; title: string }) => (
    <button type="button" title={title} onClick={() => set(!on)}
      className={`w-10 h-9 rounded-lg flex items-center justify-center border transition-colors ${
        on ? 'bg-primary text-white border-primary' : 'bg-surface-1 text-text-secondary border-border hover:bg-surface-2'}`}>
      {icon}
    </button>
  )
  const CaseBtn = ({ mode, label }: { mode: CaseMode; label: string }) => (
    <button type="button" onClick={() => setCaseMode(caseMode === mode ? 'none' : mode)}
      className={`px-3 h-9 rounded-lg border text-sm transition-colors ${
        caseMode === mode ? 'bg-primary text-white border-primary' : 'bg-surface-1 text-text-primary border-border hover:bg-surface-2'}`}>
      {label}
    </button>
  )

  return (
    <FloatingWindow
      title={t('common.rename')}
      icon={<FileText size={15} className="text-primary" />}
      onClose={onClose}
      defaultWidth={780}
      backdrop
    >
      <div className="flex gap-0 max-h-[70vh]">
        {/* Colonne contrôles */}
        <div className="w-[360px] shrink-0 p-5 space-y-4 border-r border-border overflow-y-auto">
          <div className="space-y-2">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('batch_rename.search_placeholder')}
              className="font-mono" />
            <Check v={regex} set={setRegex} label={t('batch_rename.use_regex')} />
            <Check v={matchAll} set={setMatchAll} label={t('batch_rename.match_all')} />
            <Check v={caseSensitive} set={setCaseSensitive} label={t('batch_rename.case_sensitive')} />
          </div>

          <Input value={replace} onChange={e => setReplace(e.target.value)} placeholder={t('batch_rename.replace_placeholder')}
            className="font-mono" />

          <div className="space-y-2">
            <p className="text-xs text-text-secondary">{t('batch_rename.apply_to')}</p>
            <div className="flex items-center gap-2">
              <Dropdown value={applyTo} onChange={v => setApplyTo(v as ApplyTo)}
                className="flex-1" height={36} fontSize={14}
                options={[
                  { value: 'both', label: t('batch_rename.scope_both') },
                  { value: 'name', label: t('batch_rename.scope_name') },
                  { value: 'ext',  label: t('batch_rename.scope_ext') },
                ]} />
              <IncBtn on={incFiles}   set={setIncFiles}   icon={<FileText size={16} />}   title={t('batch_rename.inc_files')} />
              <IncBtn on={incFolders} set={setIncFolders} icon={<FolderIcon size={16} />} title={t('batch_rename.inc_folders')} />
              <IncBtn on={incSub}     set={setIncSub}     icon={<FolderTree size={16} />} title={t('batch_rename.inc_subfolders')} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-text-secondary">{t('batch_rename.text_format')}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <CaseBtn mode="lower"      label="aa" />
              <CaseBtn mode="upper"      label="AA" />
              <CaseBtn mode="title"      label="Aa" />
              <CaseBtn mode="capitalize" label="Aa Aa" />
            </div>
            <p className="text-[11px] text-text-tertiary font-mono">{t('batch_rename.counter_hint')}</p>
          </div>
        </div>

        {/* Colonne aperçu */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border text-sm font-medium text-text-primary">
            <span>{t('batch_rename.original', { count: workingSet.length })}{loadingSub && <Loader2 size={13} className="inline ml-2 animate-spin" />}</span>
            <span className="text-primary">{t('batch_rename.renamed', { count: changedCount })}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {previews.length === 0 ? (
              <div className="p-6 text-sm text-text-tertiary text-center">{t('batch_rename.empty')}</div>
            ) : previews.map(({ item, next, changed }) => (
              <div key={item.id} className={`flex items-center gap-2 px-4 py-2 text-sm border-b border-border/60 ${changed ? '' : 'opacity-50'}`}>
                {item.type === 'folder' ? <FolderIcon size={14} className="shrink-0 text-text-tertiary" /> : <FileText size={14} className="shrink-0 text-text-tertiary" />}
                <span className="truncate flex-1 text-text-secondary">{item.name}</span>
                {changed && (
                  <>
                    <ArrowRight size={13} className="shrink-0 text-text-tertiary" />
                    <span className="truncate flex-1 text-text-primary font-medium">{next}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border">
        <span className="text-xs text-text-secondary">
          {applying
            ? t('batch_rename.renaming', { done: progress!.done, total: progress!.total })
            : t('batch_rename.will_rename', { count: changedCount })}
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={applying}>{t('common.cancel')}</Button>
          <Button type="button" onClick={apply} disabled={changedCount === 0} loading={applying}>{t('batch_rename.apply')}</Button>
        </div>
      </div>
    </FloatingWindow>
  )
}
