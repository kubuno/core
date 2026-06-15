// Core primitive: la chrome partagée de TOUTE application avancée (éditeurs Office
// et PaintSharp). Disposition verticale — topbar · barre de menus · options bar (toolbar)
// · (rail d'outils + corps) · bottom bar · status bar — entièrement data-driven via
// slots. L'hôte branche ses outils, panneaux, menus, options et statut ; le shell
// possède le cadre cohérent et thémé (clair Office / sombre PaintSharp).
//
// Généralisé depuis `paintsharp/ui/EditorShell` :
//  - thème complet clair+sombre (plus de '#111' codé en dur → `theme.topbarBg/statusBg`)
//  - prop `chromeless` : masque l'AppHeader global et héberge <HeaderActions/> dans
//    la topbar → récupère la rangée d'en-tête globale (gain vertical).
import { useEffect, type ReactNode } from 'react'
import { ArrowLeft, Clock, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useUiStore } from '../../store/uiStore'
import { useDocumentTitleStore } from '../../store/documentTitleStore'
import { useConfirm } from '../../hooks/useConfirm'
import ConfirmDialog, { type ConfirmOptions } from '@ui/ConfirmDialog'
import HeaderActions from '../HeaderActions'
import SearchBar from '../SearchBar'
import { MenuBar, type MenuItem } from './MenuBar'
import { WorkspaceMenuBar, buildWorkspaceMenus, type WorkspaceMenuActions, type WsMenu } from './WorkspaceMenuBar'
import { WORKSPACE_DARK, type WorkspaceTheme } from './theme'

export type { MenuItem, WorkspaceTheme }

// Champ d'édition du titre de fichier — STANDARDISÉ (repris de Documents) : input
// auto-dimensionné (un span invisible mesure le texte → pas de saut de layout),
// toujours éditable inline, commit sur blur ou Entrée. Tous les éditeurs partagent
// CE composant ; ils ne passent que la valeur + les callbacks.
function EditableTitle({ value, onChange, onCommit, placeholder, color }: {
  value: string
  onChange: (v: string) => void
  onCommit?: () => void
  placeholder?: string
  color?: string   // couleur du texte (thème sombre PaintSharp) ; sinon token clair text-text-primary
}) {
  return (
    <span className="relative inline-flex items-center" style={{ maxWidth: 260 }}>
      <span className="invisible whitespace-pre text-sm font-medium pr-2" aria-hidden="true">{value || placeholder || ''}</span>
      <input
        type="text" value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } }}
        placeholder={placeholder}
        className="absolute inset-0 w-full text-sm font-medium text-text-primary bg-transparent outline-none"
        style={color ? { color } : undefined}
      />
    </span>
  )
}

export function WorkspaceShell({
  onBack, title, titleIcon, titleSlot, onTitleChange, onTitleCommit, titlePlaceholder, saveStatus, titleActions,
  onDelete, deleteConfirm, deleteTitle, subtitle, docInfo, topbarActions, search, showSearch,
  menuActions, extraMenus, menus, menuBar, optionsBar, toolRail, toolRailWidth = 44, bottomBar, statusBar,
  theme = WORKSPACE_DARK, chromeless = false,
  topbarHeight = 40, optionsBarHeight = 30, statusHeight = 22, children,
}: {
  onBack?: () => void
  title?: ReactNode             // titre : ReactNode statique, OU valeur string si onTitleChange
  titleIcon?: ReactNode         // icône de type devant le titre (Office : fichier, grille…)
  titleSlot?: ReactNode         // override total de la zone titre (rare)
  onTitleChange?: (v: string) => void  // → champ titre éditable standard (EditableTitle)
  onTitleCommit?: () => void           // commit (blur/Entrée) — typiquement la sauvegarde
  titlePlaceholder?: string
  saveStatus?: ReactNode        // statut d'enregistrement, affiché sous le titre (Office)
  titleActions?: ReactNode      // actions juste après le titre, AVANT la recherche (ex. étoile)
  onDelete?: () => void         // → bouton corbeille STANDARD : confirme (ConfirmDialog) puis
                                //   appelle onDelete (qui supprime ET ferme l'espace de travail)
  deleteConfirm?: ConfirmOptions // texte de la confirmation (sinon défaut générique)
  deleteTitle?: string          // tooltip du bouton corbeille
  menuActions?: WorkspaceMenuActions  // → menus PAR DÉFAUT standard (Fichier/Édition/Affichage/Aide)
  extraMenus?: WsMenu[]         // menus additionnels insérés avant « Aide » (ex. Insertion/Format)
  subtitle?: ReactNode          // nom de l'éditeur ("Layer", "Apex"…), en accent
  docInfo?: ReactNode           // dimensions / nb de pages…
  topbarActions?: ReactNode     // boutons topbar à droite (undo/redo/export/save…)
  search?: ReactNode            // barre de recherche custom ; sinon SearchBar auto si chromeless
  showSearch?: boolean          // forcer/désactiver la SearchBar (défaut : = chromeless)
  menus?: { label: string; items: MenuItem[] }[]
  menuBar?: ReactNode           // barre de menus custom (ex. DocMenuBar) — alternative à `menus`
  optionsBar?: ReactNode        // rangée d'options contextuelles (la toolbar)
  toolRail?: ReactNode          // rail d'outils vertical à gauche
  toolRailWidth?: number        // largeur du rail (44 = 1 col ; ~72 = 2 col)
  bottomBar?: ReactNode         // rangée sous le corps (onglets de pages, timeline…)
  statusBar?: ReactNode         // rangée de statut en bas
  theme?: WorkspaceTheme
  chromeless?: boolean          // masque l'AppHeader global + héberge HeaderActions
  topbarHeight?: number         // hauteur topbar (40 PaintSharp ; ~52 Office titre+statut)
  optionsBarHeight?: number     // hauteur options bar/toolbar (30 PaintSharp ; 40 Office)
  statusHeight?: number         // hauteur status bar (22)
  children: ReactNode           // le corps (typiquement un <DockArea>)
}) {
  // Mode chromeless : masque l'en-tête global pendant que le shell est monté.
  const setHeaderHidden = useUiStore(s => s.setHeaderHidden)
  useEffect(() => {
    if (!chromeless) return
    setHeaderHidden(true)
    return () => setHeaderHidden(false)
  }, [chromeless, setHeaderHidden])

  // Alimente le titre de l'onglet avec le NOM DU FICHIER ouvert : uniquement
  // quand le titre est éditable (onTitleChange) et de type string → c'est le nom
  // du document. Effacé en quittant l'éditeur.
  const setDocFileName = useDocumentTitleStore(s => s.setFileName)
  useEffect(() => {
    const name = onTitleChange && typeof title === 'string' ? title : null
    setDocFileName(name)
    return () => setDocFileName(null)
  }, [title, onTitleChange, setDocFileName])

  const topbarBg = theme.topbarBg ?? '#111'
  const statusBg = theme.statusBg ?? '#111'

  // SearchBar : custom > auto (par défaut affichée dès que `chromeless`, puisque le
  // shell remplace alors l'en-tête global qui la portait → on ne peut plus l'oublier).
  // En thème sombre (PaintSharp) on rend la variante sombre + compacte (topbar de 40px).
  const dark = theme.dark ?? true
  // Topbar COLORÉE (ex. ruban Office bleu) : `topbarText` force la couleur de
  // tous les éléments de la topbar (texte/icônes) et des hovers translucides,
  // indépendamment de `dark`. La SearchBar reste claire (pastille blanche).
  const tbFg = theme.topbarText
  const tbDark = dark || !!tbFg              // hovers blancs translucides + HeaderActions clairs
  const tbColor = tbFg ?? (dark ? theme.text : undefined)
  const tbDim   = tbFg ?? (dark ? theme.textDim : undefined)
  const searchEl = search ?? ((showSearch ?? chromeless) ? <SearchBar dark={dark} compact={dark} /> : null)

  // Bouton corbeille STANDARD : confirme via ConfirmDialog (jamais de dialog navigateur)
  // puis appelle onDelete (qui supprime ET ferme l'espace). Partagé par tous les éditeurs.
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const triggerDelete = async () => {
    if (!onDelete) return
    const ok = await confirm(deleteConfirm ?? { title: 'Supprimer ?', message: 'Cette action est irréversible.', confirmLabel: 'Supprimer', variant: 'danger' })
    if (ok) onDelete()
  }
  const deleteButton = onDelete ? (
    <button
      onClick={triggerDelete}
      title={deleteTitle}
      className={tbDark ? 'p-1.5 rounded hover:bg-white/10 transition-colors flex-shrink-0' : 'p-1.5 rounded hover:bg-surface-2 text-text-secondary transition-colors flex-shrink-0'}
      style={tbColor ? { color: tbColor } : (dark ? { color: theme.textDim } : undefined)}
    >
      <Trash2 size={15} />
    </button>
  ) : null

  // Menus PAR DÉFAUT standard (Fichier/Édition/Affichage/Aide) dès que l'éditeur câble
  // `menuActions`. « Mettre à la corbeille » réutilise le flux de suppression ; Plein
  // écran / Aide / À propos sont gérés par le shell.
  const defaultMenus = menuActions ? buildWorkspaceMenus({
    t,
    actions: menuActions,
    onTrash: onDelete ? triggerDelete : undefined,
    onFullscreen: () => { if (document.fullscreenElement) document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.() },
    onAbout: () => navigate('/about'),
    extraMenus,
  }) : null

  // Topbar — UNE SEULE structure (source unique). Mêmes éléments, mêmes dimensions et
  // mêmes interactions pour TOUS les éditeurs (Office clair / PaintSharp sombre) ; seules
  // les COULEURS changent selon `dark`. Calquée sur la barre de titre Documents :
  // retour · icône · (titre éditable + statut empilé) · sous-titre/dimensions · étoile
  // · corbeille · recherche · actions · HeaderActions. Modifier ICI change tout à
  // l'identique partout — y compris le thème sombre.
  const topbar = (
    <div className="flex items-center px-2 gap-2 flex-shrink-0"
         style={{ height:topbarHeight, background:topbarBg, borderBottom: tbFg ? 'none' : `1px solid ${theme.border}` }}>
      {onBack && (
        <button onClick={onBack}
          className={`p-1.5 rounded flex-shrink-0 transition-colors ${tbDark ? 'hover:bg-white/10' : 'hover:bg-surface-2 text-text-secondary'}`}
          style={tbColor ? { color:tbColor } : (dark ? { color:theme.textDim } : undefined)}>
          <ArrowLeft size={16} />
        </button>
      )}
      <span style={tbColor ? { color:tbColor } : undefined}>{titleIcon}</span>
      {(titleSlot || title || onTitleChange || saveStatus) && (
        <div className="flex flex-col justify-center flex-shrink min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {titleSlot ?? (onTitleChange
              ? <EditableTitle value={typeof title === 'string' ? title : ''} onChange={onTitleChange} onCommit={onTitleCommit} placeholder={titlePlaceholder} color={tbColor} />
              : (title && <span className="text-sm font-medium text-text-primary truncate max-w-xs" style={tbColor ? { color:tbColor } : (dark ? { color:theme.text } : undefined)}>{title}</span>))}
            {subtitle && <span className="text-xs flex-shrink-0" style={{ color:tbFg ?? theme.accent }}>{subtitle}</span>}
            {docInfo && <span className="text-xs flex-shrink-0 text-text-tertiary" style={tbDim ? { color:tbDim } : undefined}>{docInfo}</span>}
          </div>
          {saveStatus && <span className="flex items-center gap-1 text-[10px] leading-none mt-0.5 text-text-tertiary" style={tbDim ? { color:tbDim, opacity: tbFg ? 0.9 : 1 } : undefined}><Clock size={10} />{saveStatus}</span>}
        </div>
      )}
      {titleActions}
      {deleteButton}
      {searchEl && <div className="flex-1 max-w-2xl px-2 min-w-[120px]">{searchEl}</div>}
      <div className="flex-1" />
      {topbarActions}
      {chromeless && <HeaderActions compact dark={tbDark} />}
    </div>
  )

  return (
    <div className="flex flex-col" style={{ height:'100%', background:theme.bg, color:theme.text, userSelect:'none' }}>
      {topbar}

      {/* Barre de menus : slot custom > menus standard (menuActions) > MenuBar PaintSharp (menus) */}
      {menuBar ?? (defaultMenus ? <WorkspaceMenuBar menus={defaultMenus} dark={dark} /> : (menus && <MenuBar C={theme} menus={menus} />))}

      {/* Options bar (toolbar) */}
      {optionsBar && (
        <div className="flex items-center gap-2.5 px-3 flex-shrink-0"
             style={{ height:optionsBarHeight, background:theme.header, borderBottom:`1px solid ${theme.border}`, fontSize:11 }}>
          {optionsBar}
        </div>
      )}

      {/* Corps : rail d'outils + contenu */}
      <div className="flex flex-1 min-h-0">
        {toolRail && (
          <div className="flex flex-col items-center py-2 gap-0.5 flex-shrink-0"
               style={{ width:toolRailWidth, background:theme.toolbar, borderRight:`1px solid ${theme.border}`, order:0 }}>
            {toolRail}
          </div>
        )}
        {children}
      </div>

      {/* Bottom bar (onglets de pages, timeline…) */}
      {bottomBar}

      {/* Status bar */}
      {statusBar && (
        <div className="flex items-center gap-4 px-4 flex-shrink-0"
             style={{ height:statusHeight, background:statusBg, borderTop:`1px solid ${theme.border}`, fontSize:10, color:theme.textDim }}>
          {statusBar}
        </div>
      )}

      {/* Dialogue de confirmation (bouton corbeille standard) */}
      {confirmState && <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />}
    </div>
  )
}
