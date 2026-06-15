import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LayoutGrid, Pencil } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { WaffleApp } from '../registry/WaffleAppRegistry'
import { Button } from '@ui'
import { useAuthStore } from '../store/authStore'
import { api } from '../api/client'
import type { User } from '../types'

const FAV_KEY = 'kubuno-waffle-favorites'

/** Favoris stockés côté serveur dans les préférences de l'utilisateur. */
function favsFromUser(user: User | null): string[] | null {
  const v = user?.preferences?.waffle_favorites
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : null
}

/** Cache local (fallback hors-ligne / avant chargement du profil). */
function loadFav(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch { return [] }
}

// ── Drag state ────────────────────────────────────────────────────────────────
// source tells us where the drag started:
//   'fav' = dragging an item already in favorites (reorder)
//   'all' = dragging an item from the all-apps section (add to favorites)
type DragSource = 'fav' | 'all'

interface Props { allApps: WaffleApp[]; compact?: boolean; dark?: boolean }

export default function WaffleMenu({ allApps, compact = false, dark = false }: Props) {
  const { t }      = useTranslation()
  const user       = useAuthStore(s => s.user)
  const updateUser = useAuthStore(s => s.updateUser)

  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved]     = useState<string[]>(() => favsFromUser(user) ?? loadFav())
  const [draft, setDraft]     = useState<string[]>([])

  // Synchroniser depuis les préférences serveur (login, restauration de session,
  // changement sur un autre appareil répercuté via le store).
  useEffect(() => {
    const fav = favsFromUser(user)
    if (fav) {
      setSaved(fav)
      localStorage.setItem(FAV_KEY, JSON.stringify(fav))
    }
  }, [user])

  // Drag state
  const [dragId, setDragId]           = useState<string | null>(null)
  const [dragSrc, setDragSrc]         = useState<DragSource | null>(null)
  const [favDropOver, setFavDropOver] = useState<string | null>(null) // id of fav item being hovered
  const [favZoneOver, setFavZoneOver] = useState(false)               // hovering the fav container
  const [allZoneOver, setAllZoneOver] = useState(false)               // hovering the all-apps container

  const avail      = new Set(allApps.map(a => a.id))
  const validSaved = saved.filter(id => avail.has(id))
  const favApps    = validSaved.map(id => allApps.find(a => a.id === id)).filter(Boolean) as WaffleApp[]
  const draftApps  = draft.map(id => allApps.find(a => a.id === id)).filter(Boolean) as WaffleApp[]
  const displayed  = editing ? draftApps : favApps

  // ── Edit controls ──────────────────────────────────────────────────────────

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDraft([...validSaved])
    setEditing(true)
  }

  const cancel = () => setEditing(false)

  const confirm = () => {
    setSaved(draft)
    setEditing(false)
    // Cache local immédiat
    localStorage.setItem(FAV_KEY, JSON.stringify(draft))
    // Persistance côté serveur dans les préférences de l'utilisateur
    api.patch<{ user: User }>('/me', { preferences: { waffle_favorites: draft } })
      .then(({ data }) => { if (data?.user) updateUser({ preferences: data.user.preferences }) })
      .catch(() => { /* le cache localStorage assure le fallback */ })
  }

  const toggleDraft = (id: string) =>
    setDraft(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const resetDrag = () => {
    setDragId(null)
    setDragSrc(null)
    setFavDropOver(null)
    setFavZoneOver(false)
    setAllZoneOver(false)
  }

  // Called when dragging starts on a favorites item
  const onFavDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    setDragId(id)
    setDragSrc('fav')
  }

  // Called when dragging starts on an all-apps item
  const onAllDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', id)
    setDragId(id)
    setDragSrc('all')
  }

  // Hovering over a specific favorites item — used for reorder indicator
  const onFavItemDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = dragSrc === 'fav' ? 'move' : 'copy'
    setFavDropOver(id)
    setFavZoneOver(true)
  }

  // Hovering over the favorites container (empty space)
  const onFavContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = dragSrc === 'fav' ? 'move' : 'copy'
    setFavZoneOver(true)
  }

  const onFavContainerDragLeave = (e: React.DragEvent) => {
    // Only clear if we left the container entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setFavZoneOver(false)
      setFavDropOver(null)
    }
  }

  // Drop ON a specific favorites item
  const onFavItemDrop = (e: React.DragEvent, toId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const fromId = dragId ?? e.dataTransfer.getData('text/plain')
    if (!fromId) { resetDrag(); return }

    if (dragSrc === 'fav' && fromId !== toId) {
      // Reorder within favorites
      setDraft(prev => {
        const arr = [...prev]
        const fi = arr.indexOf(fromId), ti = arr.indexOf(toId)
        if (fi < 0 || ti < 0) return prev
        arr.splice(fi, 1)
        arr.splice(ti, 0, fromId)
        return arr
      })
    } else if (dragSrc === 'all') {
      // Insert before the hovered item
      setDraft(prev => {
        if (prev.includes(fromId)) return prev   // already a favorite
        const arr = [...prev]
        const ti = arr.indexOf(toId)
        if (ti < 0) return [...arr, fromId]
        arr.splice(ti, 0, fromId)
        return arr
      })
    }
    resetDrag()
  }

  // Drop on the favorites container (not on a specific item — append)
  const onFavContainerDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const fromId = dragId ?? e.dataTransfer.getData('text/plain')
    if (!fromId) { resetDrag(); return }

    if (dragSrc === 'all') {
      setDraft(prev => prev.includes(fromId) ? prev : [...prev, fromId])
    }
    resetDrag()
  }

  // All-apps section drop: dragging a favorite here removes it from favorites
  const onAllContainerDragOver = (e: React.DragEvent) => {
    if (dragSrc !== 'fav') return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setAllZoneOver(true)
  }

  const onAllContainerDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setAllZoneOver(false)
  }

  const onAllContainerDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const fromId = dragId ?? e.dataTransfer.getData('text/plain')
    if (!fromId) { resetDrag(); return }
    if (dragSrc === 'fav') {
      setDraft(prev => prev.filter(x => x !== fromId))
    }
    resetDrag()
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  // In edit mode: exclude draft favorites from the all-apps list (they're in the white card)
  // In normal mode: exclude saved favorites from the all-apps list
  const nonFavApps = editing
    ? allApps.filter(a => !draft.includes(a.id))
    : allApps.filter(a => !validSaved.includes(a.id))

  // ── Classement des apps NON-favorites ───────────────────────────────────────
  // • Les apps d'un module exposant PLUSIEURS apps (sous-modules : Office, PaintSharp…)
  //   sont REGROUPÉES sous leur module, triées alpha à l'intérieur.
  // • Les apps autonomes (module à 1 seule app) sont listées à part, triées alpha.
  const byLabel = (x: WaffleApp, y: WaffleApp) => x.label.localeCompare(y.label)
  const moduleAppCount = allApps.reduce<Record<string, number>>((acc, a) => {
    const mid = a.moduleId ?? a.id; acc[mid] = (acc[mid] ?? 0) + 1; return acc
  }, {})
  const moduleGroups: { moduleId: string; label: string; apps: WaffleApp[] }[] = []
  const standaloneApps: WaffleApp[] = []
  for (const a of nonFavApps) {
    const mid = a.moduleId ?? a.id
    if ((moduleAppCount[mid] ?? 1) > 1) {
      let g = moduleGroups.find(x => x.moduleId === mid)
      if (!g) { g = { moduleId: mid, label: a.moduleLabel ?? mid, apps: [] }; moduleGroups.push(g) }
      g.apps.push(a)
    } else {
      standaloneApps.push(a)
    }
  }
  moduleGroups.forEach(g => g.apps.sort(byLabel))
  moduleGroups.sort((a, b) => a.label.localeCompare(b.label))
  standaloneApps.sort(byLabel)

  const favZonePlaceholder = editing && displayed.length === 0

  // Rendu d'une cellule de la zone « toutes les apps » (non-favorites) : version
  // éditable (glissable vers les favoris) ou lien normal. Partagé par les apps
  // autonomes et les groupes de sous-modules.
  const renderAllAppCell = (app: WaffleApp) => (
    editing ? (
      <div
        key={app.id}
        draggable
        onDragStart={e => onAllDragStart(e, app.id)}
        onDragEnd={resetDrag}
        onClick={() => toggleDraft(app.id)}
        className={`flex flex-col items-center gap-2 p-3 rounded-xl select-none
                    hover:bg-white/60 cursor-grab active:cursor-grabbing transition-colors
                    ${dragId === app.id ? 'opacity-40' : ''}`}
      >
        <app.Icon size={48} className="text-text-secondary" />
        <span className="text-xs text-text-secondary text-center leading-tight">{app.label}</span>
      </div>
    ) : (
      <DropdownMenu.Item key={app.id} asChild>
        <Link
          to={app.path}
          className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/70 transition-colors outline-none"
        >
          <app.Icon size={48} className="text-text-secondary" />
          <span className="text-xs text-text-secondary text-center leading-tight">{app.label}</span>
        </Link>
      </DropdownMenu.Item>
    )
  )

  return (
    <DropdownMenu.Root
      open={open}
      onOpenChange={v => { setOpen(v); if (!v) setEditing(false) }}
    >
      <DropdownMenu.Trigger asChild>
        <button
          className={`${compact ? 'w-9 h-9' : 'w-12 h-12'} rounded-full flex items-center justify-center transition-colors focus:outline-none ${
            dark ? 'text-white/75 hover:bg-white/15 data-[state=open]:bg-white/15' : 'text-text-secondary hover:bg-surface-3 data-[state=open]:bg-surface-3'}`}
          aria-label={t('header.apps')}
        >
          <LayoutGrid size={compact ? 18 : 20} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          onEscapeKeyDown={e => { if (editing) { e.preventDefault(); cancel() } }}
          onPointerDownOutside={e => { if (editing) e.preventDefault() }}
          onFocusOutside={e => { if (editing) e.preventDefault() }}
          className="w-[340px] rounded-2xl border border-border shadow-xl z-[9999] overflow-hidden flex flex-col"
          style={{ background: '#f1f3f4', maxHeight: 'calc(100vh - 80px)' }}
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          {editing ? (
            <div className="px-3 pt-3 pb-2 flex-shrink-0" style={{ background: '#f1f3f4' }}>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={cancel}>
                  {t('common.cancel')}
                </Button>
                <Button variant="primary" size="sm" onClick={confirm}>
                  {t('shell.ok')}
                </Button>
              </div>
              <p className="text-xs text-text-tertiary text-center mt-2 mb-1">
                {t('shell.drag_apps')}
              </p>
            </div>
          ) : (
            <div
              className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0"
              style={{ background: '#f1f3f4' }}
            >
              <span className="text-sm font-semibold text-text-primary">{t('shell.favorites')}</span>
              <button
                onClick={startEdit}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white
                           hover:bg-surface-2 text-text-secondary shadow-sm border border-border
                           transition-colors"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}

          {/* ── Scrollable body ────────────────────────────────────────────── */}
          <div className="overflow-y-auto flex-1">

            {/* ── Favorites card (white) ───────────────────────────────────── */}
            <div
              className={`mx-3 mb-2 bg-white rounded-2xl overflow-hidden transition-colors
                ${editing && favZoneOver && dragSrc === 'all'
                    ? 'ring-2 ring-primary bg-primary/5'
                    : ''}`}
              onDragOver={editing ? onFavContainerDragOver : undefined}
              onDragLeave={editing ? onFavContainerDragLeave : undefined}
              onDrop={editing ? onFavContainerDrop : undefined}
            >
              {favZonePlaceholder ? (
                /* Empty drop zone — visible only in edit mode with no favorites */
                <div
                  className={`flex items-center justify-center py-8 px-4 rounded-2xl border-2 border-dashed
                               transition-colors text-center text-xs leading-relaxed
                               ${favZoneOver && dragSrc === 'all'
                                 ? 'border-primary text-primary bg-primary/5'
                                 : 'border-border text-text-tertiary'}`}
                >
                  {t('shell.drag_here')}
                </div>
              ) : (
                <div className="grid grid-cols-3 p-3 gap-1">
                  {displayed.map(app => (
                    editing ? (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={e => onFavDragStart(e, app.id)}
                        onDragEnd={resetDrag}
                        onDragOver={e => onFavItemDragOver(e, app.id)}
                        onDrop={e => onFavItemDrop(e, app.id)}
                        onClick={() => toggleDraft(app.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl select-none
                                    cursor-grab active:cursor-grabbing transition-colors
                                    ${dragId === app.id
                                        ? 'opacity-40'
                                        : favDropOver === app.id && dragSrc === 'fav'
                                            ? 'bg-primary/10 ring-1 ring-primary'
                                            : 'hover:bg-surface-1'}`}
                      >
                        <app.Icon size={48} className="text-text-secondary" />
                        <span className="text-xs text-text-secondary text-center leading-tight">
                          {app.label}
                        </span>
                      </div>
                    ) : (
                      <DropdownMenu.Item key={app.id} asChild>
                        <Link
                          to={app.path}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl
                                     hover:bg-surface-1 transition-colors outline-none"
                        >
                          <app.Icon size={48} className="text-text-secondary" />
                          <span className="text-xs text-text-secondary text-center leading-tight">
                            {app.label}
                          </span>
                        </Link>
                      </DropdownMenu.Item>
                    )
                  ))}
                </div>
              )}
            </div>

            {/* ── All apps (gray) — only non-favorites shown ────────────── */}
            <div
              className={`pb-3 rounded-b-2xl transition-colors
                ${editing && allZoneOver && dragSrc === 'fav'
                    ? 'bg-danger/5 ring-2 ring-inset ring-danger/30'
                    : ''}`}
              onDragOver={editing ? onAllContainerDragOver : undefined}
              onDragLeave={editing ? onAllContainerDragLeave : undefined}
              onDrop={editing ? onAllContainerDrop : undefined}
            >
              {nonFavApps.length === 0 && editing ? (
                <p className="text-xs text-text-tertiary text-center py-6 px-4">
                  {t('shell.all_in_favorites')}
                </p>
              ) : (
                <>
                  {/* Apps autonomes — triées alphabétiquement */}
                  {standaloneApps.length > 0 && (
                    <div className="grid grid-cols-3 px-3 gap-1">
                      {standaloneApps.map(renderAllAppCell)}
                    </div>
                  )}

                  {/* Sous-modules — regroupés par module (en-tête), triés alpha */}
                  {moduleGroups.map(group => (
                    <div key={group.moduleId} className="mt-1">
                      <div className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                        {group.label}
                      </div>
                      <div className="grid grid-cols-3 px-3 gap-1">
                        {group.apps.map(renderAllAppCell)}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
