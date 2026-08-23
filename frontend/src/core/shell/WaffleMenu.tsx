import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LayoutGrid, Pencil } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { WaffleApp } from '../registry/WaffleAppRegistry'
import { appNavMemory } from '../store/appNavMemory'
import { Button } from '@ui'
import { useAuthStore } from '../store/authStore'
import { usePrivileges } from '../authz/usePrivileges'
import { adminUrl } from '../admin/adminAction'
import { PRIV } from '../authz/types'
import { api } from '../api/client'
import type { User } from '../types'

const FAV_KEY = 'kubuno-waffle-favorites'

/** La carte blanche accueille une grille 3×3 : au-delà, la dernière tuile en sort. */
const FAV_MAX = 9

/** Tronque à FAV_MAX — insérer une 10e tuile évince celle qui est en dernier. */
const capFavorites = (ids: string[]) => ids.slice(0, FAV_MAX)

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

interface Props { allApps: WaffleApp[]; compact?: boolean; dark?: boolean; fab?: boolean; onOpenChange?: (open: boolean) => void }

// `compact` stays in Props for the callers, but no longer changes the trigger
// size — 36px circles everywhere (aligned on the office title bar).
export default function WaffleMenu({ allApps, dark = false, fab = false, onOpenChange }: Props) {
  const { t }      = useTranslation()
  const user       = useAuthStore(s => s.user)
  const updateUser = useAuthStore(s => s.updateUser)
  const { can }    = usePrivileges()

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

  /* Défilement automatique quand la tuile glissée approche d'un bord du panneau.
   *
   * Attaché via une REF DE RAPPEL et non un `useEffect` : plusieurs instances de ce
   * composant coexistent (barre du haut, bouton flottant mobile) et le panneau est monté
   * dans un portail Radix, si bien qu'un effet pouvait s'exécuter alors que la ref était
   * encore nulle. La ref de rappel se déclenche exactement quand le nœud apparaît.
   *
   * Écouteur NATIF en phase de CAPTURE : les tuiles de favoris appellent
   * `stopPropagation()` sur leur `dragover`, ce qui empêcherait un handler d'ancêtre de
   * se déclencher au-dessus de la carte — donc au bord haut, là où on en a besoin.
   *
   * La vitesse est mémorisée et rejouée en boucle d'animation : `dragover` ne se
   * déclenche que sur mouvement, or il faut continuer à défiler quand le pointeur reste
   * immobile contre le bord. */
  const autoScrollOff = useRef<(() => void) | null>(null)
  const scrollAreaRef = useCallback((el: HTMLDivElement | null) => {
    autoScrollOff.current?.()
    autoScrollOff.current = null
    if (!el) return

    /* Bande sensible large, avec une vitesse PLANCHER : une rampe partant de zéro
     * rendait les trois quarts de la bande inopérants — à 60px du bord on obtenait 1px
     * par image, invisible — et il fallait coller au bord pour que ça bouge. */
    const ZONE = 120  // hauteur de la bande sensible, en px
    const MIN  = 6    // vitesse au bord extérieur de la bande, en px par image
    const MAX  = 28   // vitesse contre le bord du panneau
    let vy = 0
    let raf: number | null = null

    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf)
      raf = null
      vy = 0
    }
    const step = () => {
      if (!vy) { stop(); return }
      el.scrollTop += vy
      raf = requestAnimationFrame(step)
    }
    const onDragOver = (e: DragEvent) => {
      const r = el.getBoundingClientRect()
      // sur un panneau court, deux bandes de 120px se recouvriraient
      const zone = Math.min(ZONE, r.height * 0.35)
      const speed = (d: number) => MIN + (MAX - MIN) * (1 - Math.max(d, 0) / zone)
      const top = e.clientY - r.top
      const bottom = r.bottom - e.clientY
      if (top < zone)         vy = -speed(top)
      else if (bottom < zone)  vy =  speed(bottom)
      else                     vy = 0
      if (vy && raf === null) raf = requestAnimationFrame(step)
      else if (!vy) stop()
    }

    el.addEventListener('dragover', onDragOver, true)
    el.addEventListener('drop', stop, true)
    document.addEventListener('dragend', stop, true)
    autoScrollOff.current = () => {
      stop()
      el.removeEventListener('dragover', onDragOver, true)
      el.removeEventListener('drop', stop, true)
      document.removeEventListener('dragend', stop, true)
    }
  }, [])

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
    setDraft(prev => prev.includes(id) ? prev.filter(x => x !== id) : capFavorites([...prev, id]))

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
        return capFavorites(arr)
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
      setDraft(prev => prev.includes(fromId) ? prev : capFavorites([...prev, fromId]))
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

  // Launching an app returns the user to the last location they visited within
  // it (this tab) instead of its root — so leaving an app doesn't lose your place.
  const launchTarget = (app: WaffleApp) => appNavMemory.get(app.id) ?? app.landing ?? app.path

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
        className={`flex flex-col items-center gap-2 px-2 py-4 rounded-[16px] select-none
                    hover:bg-white/60 cursor-grab active:cursor-grabbing transition-colors
                    ${dragId === app.id ? 'opacity-40' : ''}`}
      >
        <app.Icon size={48} className="text-text-secondary" />
        <span className="text-xs text-text-secondary text-center leading-tight">{app.label}</span>
      </div>
    ) : (
      <DropdownMenu.Item key={app.id} asChild>
        <Link
          to={launchTarget(app)}
          draggable={false}
          className="flex flex-col items-center gap-2 px-2 py-4 rounded-[16px] select-none
                     hover:bg-black/[0.06] transition-colors outline-none"
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
      onOpenChange={v => { setOpen(v); if (!v) setEditing(false); onOpenChange?.(v) }}
    >
      <DropdownMenu.Trigger asChild>
        {fab ? (
          // Mobile floating action button variant: the app launcher lives
          // bottom-right (positioned by the parent) as the primary blue FAB.
          <button
            aria-label={t('header.apps')}
            className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center
                       shadow-[0_4px_14px_rgba(26,115,232,0.45)] active:scale-95 transition-transform focus:outline-none"
          >
            <LayoutGrid size={26} />
          </button>
        ) : (
          <button
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors focus:outline-none ${
              dark ? 'text-white/75 hover:bg-white/15 data-[state=open]:bg-white/15' : 'text-text-secondary hover:bg-surface-3 data-[state=open]:bg-surface-3'}`}
            aria-label={t('header.apps')}
          >
            <LayoutGrid size={18} />
          </button>
        )}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          side={fab ? 'top' : 'bottom'}
          sideOffset={fab ? 10 : 4}
          collisionPadding={{ top: 12, right: 8, bottom: 12, left: 8 }}
          onEscapeKeyDown={e => { if (editing) { e.preventDefault(); cancel() } }}
          onPointerDownOutside={e => { if (editing) e.preventDefault() }}
          onFocusOutside={e => { if (editing) e.preventDefault() }}
          // rayon explicite : l'échelle globale ramène `rounded-2xl` à 8px, trop anguleux
          // pour ce panneau — exception assumée, alignée sur la référence visuelle
          className={`w-[360px] max-w-[calc(100vw-16px)] rounded-[28px] z-[9999] overflow-hidden flex flex-col ${fab ? '' : 'border border-border'}`}
          // Fixed 580px cap, but never taller than the space Radix actually has (which
          // accounts for the trigger side + collision padding): on a short viewport the
          // available height wins, so the panel still cannot overflow. The header stays
          // pinned and the body scrolls instead of « Favoris » being clipped off-screen.
          style={{
            background: '#E9EEF6',
            boxShadow: '0 4px 8px 3px rgba(0,0,0,.15),0 1px 3px rgba(0,0,0,.3)',
            // 580px en consultation ; en modification on rend la pleine hauteur
            // disponible, le glisser-déposer ayant besoin de voir les deux zones.
            maxHeight: editing
              ? 'var(--radix-dropdown-menu-content-available-height, calc(100vh - 80px))'
              : 'min(580px, var(--radix-dropdown-menu-content-available-height, calc(100vh - 80px)))',
          }}
        >
          {/* ── Scrollable body ────────────────────────────────────────────── */}
          {/* `scrollbar-gutter: stable both-edges` : la barre de défilement est prise
              sur une gouttière réservée des DEUX côtés, présente ou non. Sans ça elle
              rogne le contenu à droite seulement et la marge de la carte devient
              asymétrique dès que la liste défile. */}
          <div ref={scrollAreaRef} className="kb-inset-scroll overflow-y-auto flex-1" style={{ scrollbarGutter: 'stable both-edges' }}>

            {/* ── Favorites card (white) ───────────────────────────────────────
                The header lives INSIDE this card — the white surface covers the
                « Favoris » title and its edit button, the tinted panel background
                only showing as a margin around the card and below it. */}
            <div
              className="mx-1 mt-3 mb-2 bg-white rounded-[20px] overflow-hidden"
              onDragOver={editing ? onFavContainerDragOver : undefined}
              onDragLeave={editing ? onFavContainerDragLeave : undefined}
              onDrop={editing ? onFavContainerDrop : undefined}
            >
              {/* ── Header, on the white surface ──────────────────────────── */}
              {editing ? (
                <div className="px-4 pt-4 pb-1">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={cancel} className="rounded-full px-5 bg-surface-2 hover:bg-surface-3">
                      {t('common.cancel')}
                    </Button>
                    <Button variant="primary" onClick={confirm} className="rounded-full px-6">
                      {t('shell.ok')}
                    </Button>
                  </div>
                  <p className="text-sm text-text-secondary text-center mt-3">
                    {t('shell.drag_apps')}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between px-5 pt-4 pb-1">
                  <span className="text-base font-semibold text-text-primary">{t('shell.favorites')}</span>
                  <button
                    onClick={startEdit}
                    className="w-10 h-10 rounded-full flex items-center justify-center
                               bg-surface-2 hover:bg-surface-3 text-text-secondary transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              )}

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
                <div className="grid grid-cols-3 p-4 gap-1">
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
                        className={`relative flex flex-col items-center gap-2 px-2 py-4 rounded-[16px] select-none
                                    cursor-grab active:cursor-grabbing transition-colors
                                    ${dragId === app.id ? 'opacity-40' : 'hover:bg-black/[0.06]'}`}
                      >
                        {/* Tiret d'insertion : la tuile se posera AVANT celle-ci, le
                            trait se place donc dans la gouttière de gauche. */}
                        {favDropOver === app.id && dragId !== app.id && (
                          <span
                            aria-hidden
                            className="absolute -left-0.5 top-3 bottom-3 w-[3px] rounded-full bg-text-secondary"
                          />
                        )}
                        <app.Icon size={48} className="text-text-secondary" />
                        <span className="text-xs text-text-secondary text-center leading-tight">
                          {app.label}
                        </span>
                      </div>
                    ) : (
                      <DropdownMenu.Item key={app.id} asChild>
                        <Link
                          to={launchTarget(app)}
                          draggable={false}
                          className="flex flex-col items-center gap-2 px-2 py-4 rounded-[16px] select-none
                                     hover:bg-black/[0.06] transition-colors outline-none"
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
              className={`pb-4 rounded-b-[28px] transition-colors
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
                    <div className="grid grid-cols-3 px-5 gap-1">
                      {standaloneApps.map(renderAllAppCell)}
                    </div>
                  )}

                  {/* Sous-modules — regroupés par module (en-tête), triés alpha */}
                  {moduleGroups.map(group => (
                    <div key={group.moduleId} className="mt-1">
                      <div className="px-5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                        {group.label}
                      </div>
                      <div className="grid grid-cols-3 px-5 gap-1">
                        {group.apps.map(renderAllAppCell)}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* ── Marketplace ────────────────────────────────────────────────
                Pied de panneau, après tous les modules. Le lien mène à l'onglet
                « place de marché » de l'administration : on l'affiche exactement
                à qui détient le privilège correspondant, sinon il ne mène qu'à un
                refus. Masqué en mode modification, où le panneau sert au
                glisser-déposer. */}
            {!editing && can(PRIV.MARKETPLACE_MANAGE) && (
              <DropdownMenu.Item asChild>
                <Link
                  to={adminUrl({ tab: 'marketplace' })}
                  className="mx-5 mt-3 mb-4 flex items-center justify-center rounded-full
                             border border-border px-4 py-2.5 text-center text-xs text-primary
                             hover:bg-black/[0.04] transition-colors outline-none"
                >
                  {t('shell.more_modules')}
                </Link>
              </DropdownMenu.Item>
            )}

          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
