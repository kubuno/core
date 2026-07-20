import { useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button, Badge, Input, Toggle, Checkbox, Radio, Spinner, Separator, Dropdown, RangeSlider,
  DatePicker, ThemePreviewContext, KubunoLogo,
  NumberInput, Textarea, RichText, FloatCheckbox, FontPicker, Tabs, Accordion,
  ColorField, ColorSwatchPicker, ColorPicker, GradientField, GradientPicker,
  LIGHT_PICKER_THEME, DEFAULT_PICKER_THEME, DEFAULT_GRADIENT,
  FloatingWindow, ConfirmDialog, ConflictDialog, AnchoredPopover, ResizeHandle, StartPage,
  PortalHostContext,
} from '@ui'
import type { Gradient } from '@ui'
import {
  Search, Home, ChevronRight, Star, MoreVertical, FileText, Folder,
  CloudUpload, Loader2, CheckCircle2, Plus, House, Trash2,
  Download, Share2, Pencil, Copy, Info,
} from 'lucide-react'
import type { ThemeDef } from '../store/themeStore'
import PreviewFrame from './PreviewFrame'

/**
 * Live preview of a theme's "objects" — primitives and complex components —
 * rendered with the theme's colours/variables scoped to this subtree only, and
 * (for trusted themes) its component overrides resolved via the preview scope.
 * Nothing here affects the live application until the theme is applied.
 */


function Swatch({ varName, label }: { varName: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-10 h-10 rounded-lg border border-border"
        style={{ background: `var(${varName})` }}
      />
      <span className="text-[10px] text-text-tertiary">{label}</span>
    </div>
  )
}

// ── Faithful mocks of real Drive objects (cf. drive/StorageExplorer.tsx) ───────

function MockFileCard({ name = 'Rapport.pdf', ext = 'PDF', selected = false }) {
  return (
    <div
      className={`group relative rounded-xl border min-w-0 select-none transition-all w-44
        ${selected
          ? 'border-primary ring-2 ring-primary/20 bg-[#ddeafc]'
          : 'border-[#e8eaed] bg-surface-1 hover:border-border hover:bg-[#e4ecf7]'}`}
    >
      <div className="flex items-center gap-2 px-3 h-10">
        <FileText size={18} className="shrink-0 text-text-secondary" />
        <span className="text-[13px] font-medium text-text-primary truncate flex-1">{name}</span>
        <Star size={12} className="shrink-0 fill-yellow-400 text-yellow-400" />
        <MoreVertical size={14} className="shrink-0 text-text-secondary opacity-0 group-hover:opacity-100" />
      </div>
      <div className="relative overflow-hidden rounded-lg bg-white mx-2 mb-2 h-24 flex items-center justify-center">
        <FileText size={40} className="text-text-tertiary" />
      </div>
      {/* Extension badge — a CARD-level child (not nested in the white preview)
          using `background-color: inherit`, so its padding ring takes the card's
          own background in every state and carves a seamless notch into the
          preview corner. Mirrors the real FileCard (cf. drive/StorageExplorer). */}
      <span
        className="absolute z-10 inline-block pointer-events-none"
        style={{ bottom: '4px', right: '4px', padding: '7px', borderRadius: '12px 0 0 0',
          backgroundColor: 'inherit',
          transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <span
          className="block font-semibold uppercase"
          style={{ fontSize: '9px', lineHeight: 1, padding: '2px 5px', letterSpacing: '0.04em',
            borderRadius: '6px', color: 'var(--color-text-secondary)' }}
        >
          {ext}
        </span>
      </span>
    </div>
  )
}

function MockFolderCard({ name = 'Documents', selected = false }) {
  return (
    <div
      className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all select-none w-44
        ${selected
          ? 'border-primary ring-2 ring-primary/20 bg-[#c9defa]'
          : 'border-[#e8eaed] bg-[#f3f4f5] hover:border-border hover:bg-[#e4ecf7]'}`}
    >
      <Folder size={20} className="shrink-0 text-text-secondary" />
      <span className="text-sm text-text-primary truncate flex-1">{name}</span>
      <MoreVertical size={14} className="shrink-0 text-text-secondary opacity-0 group-hover:opacity-100" />
    </div>
  )
}

function MockFileRow({ name = 'Photo-2026.jpg', size = '2,4 Mo', selected = false }) {
  return (
    <div
      className={`group relative flex items-center gap-3 px-3 py-2 transition-colors select-none border-l-[3px]
        ${selected ? 'bg-[#e8f0fe] border-primary' : 'bg-white border-transparent hover:bg-surface-1'}`}
    >
      <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded overflow-hidden bg-surface-2">
        <FileText size={16} className="text-text-tertiary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{name}</p>
      </div>
      <span className="text-xs text-text-tertiary shrink-0 w-28 text-right">30 juin 2026</span>
      <span className="text-xs text-text-tertiary shrink-0 w-20 text-right">{size}</span>
      <MoreVertical size={14} className="shrink-0 text-text-secondary opacity-0 group-hover:opacity-100" />
    </div>
  )
}

function MockBreadcrumb() {
  return (
    <nav className="flex items-center min-w-0">
      <ol className="inline-flex items-center gap-1.5 flex-wrap min-w-0">
        <li className="inline-flex items-center">
          <button className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary transition-colors">
            <Home size={16} className="me-1.5 shrink-0" />
            <span>Mon Drive</span>
          </button>
        </li>
        <li className="inline-flex items-center gap-1.5">
          <ChevronRight size={14} className="text-text-tertiary shrink-0" />
          <span className="text-sm font-medium text-text-primary">Documents</span>
        </li>
      </ol>
    </nav>
  )
}

function MockUploadPanel() {
  return (
    <div className="w-72 bg-white rounded-xl shadow-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-1 border-b border-border">
        <Loader2 size={14} className="animate-spin text-primary" />
        <span className="text-sm font-medium text-text-primary">Import en cours…</span>
      </div>
      <ul className="divide-y divide-border">
        <li className="flex items-center gap-3 px-4 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-primary truncate">presentation.pptx</p>
            <div className="mt-1 h-1 w-full bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '64%' }} />
            </div>
          </div>
        </li>
        <li className="flex items-center gap-3 px-4 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-primary truncate">notes.txt</p>
          </div>
          <CheckCircle2 size={14} className="text-success shrink-0" />
        </li>
      </ul>
    </div>
  )
}

// ── Core shell mocks (topbar, sidebar item, search) ───────────────────────────

function MockTopbar() {
  return (
    <div className="flex items-center gap-3 h-14 px-4 bg-white border border-border rounded-xl">
      <KubunoLogo className="h-6 w-auto shrink-0" />
      <div className="flex-1 max-w-md">
        <div className="flex items-center gap-2 h-9 px-3 rounded-full bg-search-bg text-text-secondary">
          <Search size={16} />
          <span className="text-sm">Rechercher…</span>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">
        AK
      </div>
    </div>
  )
}

function MockSidebar() {
  const items = [
    { icon: House, label: 'Accueil', active: true },
    { icon: Folder, label: 'Mon Drive', active: false },
    { icon: Star, label: 'Étoilés', active: false },
    { icon: Trash2, label: 'Corbeille', active: false },
  ]
  return (
    <div className="w-52 p-2 bg-white border border-border rounded-xl">
      <button className="flex items-center gap-2 w-full h-10 px-3 mb-2 rounded-full bg-primary-light text-text-nav-active font-medium text-sm">
        <Plus size={18} /> Nouveau
      </button>
      {items.map(({ icon: Icon, label, active }) => (
        <div
          key={label}
          className={`flex items-center gap-3 h-9 px-3 rounded-full text-sm cursor-pointer
            ${active ? 'bg-primary-light text-text-nav-active font-medium' : 'text-text-secondary hover:bg-surface-2'}`}
        >
          <Icon size={18} /> {label}
        </div>
      ))}
    </div>
  )
}

// Faithful static reproduction of the Office ribbon chrome (cf. office Ribbon.tsx).
// Consumes the SAME `--kbn-ws-*` / `--kbn-office-*` CSS variables with the SAME
// fallbacks as the real components, so the preview shows exactly how a theme
// re-skins the ribbon (unified tab strip, dark surfaces, unified accents…).
function MockRibbon() {
  const smallBtn = (icon: ReactNode, label: string, active = false) => (
    <div
      className="flex items-center h-[22px] px-1.5 gap-1 rounded text-[11px] whitespace-nowrap cursor-default"
      style={active
        ? { background: 'var(--kbn-office-item-active-bg, #1a73e822)', color: 'var(--kbn-office-item-active-text, #1a73e8)' }
        : { color: 'var(--kbn-ws-text, #202124)' }}
    >
      <span className="flex items-center justify-center w-4 h-4">{icon}</span>{label}
    </div>
  )
  const groupLabel = { color: 'var(--kbn-ws-text-dim, #5f6368)' }
  const sep = { width: 1, background: 'var(--kbn-ws-border, #dadce0)' }
  return (
    <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--kbn-ws-border, #dadce0)' }}>
      {/* Tab strip (per-app tone, theme-overridable) */}
      <div className="flex items-end gap-1 px-2 pt-1.5" style={{ height: 34, background: 'var(--kbn-office-tabstrip, #1557b0)' }}>
        <div className="px-3.5 h-[26px] flex items-center text-[12px] font-semibold rounded-t-lg"
          style={{ background: 'var(--kbn-office-file-accent, #3f7dd0)', color: 'var(--kbn-office-file-accent-text, #fff)' }}>
          Fichier
        </div>
        <div className="px-3.5 h-[26px] flex items-center text-[12px] font-medium rounded-t-lg"
          style={{ background: 'var(--kbn-ws-bg, #ffffff)', color: 'var(--kbn-office-tab-active-text, #1557b0)' }}>
          Accueil
        </div>
        {['Insertion', 'Mise en page', 'Affichage'].map((l) => (
          <div key={l} className="px-3.5 h-[26px] flex items-center text-[12px] font-medium rounded-t-lg"
            style={{ color: 'var(--kbn-office-tabstrip-text, #ffffff)' }}>
            {l}
          </div>
        ))}
      </div>
      {/* Groups row */}
      <div className="flex items-stretch px-2" style={{ height: 84, background: 'var(--kbn-ws-bg, #ffffff)' }}>
        <div className="flex flex-col justify-between px-2 py-1">
          <div className="flex flex-col justify-center gap-0.5 flex-1">
            {smallBtn(<Copy size={13} />, 'Copier')}
            {smallBtn(<Pencil size={13} />, 'Coller')}
          </div>
          <div className="text-[10px] text-center whitespace-nowrap" style={groupLabel}>Presse-papiers</div>
        </div>
        <div className="self-stretch my-2" style={sep} />
        <div className="flex flex-col justify-between px-2 py-1">
          <div className="flex items-stretch gap-0.5 flex-1">
            <div className="flex flex-col justify-center gap-0.5">
              {smallBtn(<span className="font-bold text-[13px]">G</span>, 'Gras', true)}
              {smallBtn(<span className="italic text-[13px]">I</span>, 'Italique')}
            </div>
            <div className="flex flex-col justify-center gap-0.5">
              {smallBtn(<span className="underline text-[13px]">S</span>, 'Souligné')}
              {smallBtn(<FileText size={13} />, 'Styles')}
            </div>
          </div>
          <div className="text-[10px] text-center whitespace-nowrap" style={groupLabel}>Police</div>
        </div>
        <div className="self-stretch my-2" style={sep} />
        <div className="flex flex-col justify-between px-2 py-1">
          <div className="flex items-center justify-center flex-1">
            <div className="flex flex-col w-14 items-center justify-center gap-1 rounded cursor-default"
              style={{ color: 'var(--kbn-ws-text, #202124)' }}>
              <Folder size={22} />
              <span className="text-[10px] leading-tight text-center">Insérer</span>
            </div>
          </div>
          <div className="text-[10px] text-center whitespace-nowrap" style={groupLabel}>Objets</div>
        </div>
      </div>
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 text-[11px]"
        style={{ height: 22, background: 'var(--kbn-ws-status, #f8f9fa)', color: 'var(--kbn-ws-text-dim, #5f6368)', borderTop: '1px solid var(--kbn-ws-border, #dadce0)' }}>
        <span>Page 1 sur 3 · 428 mots</span>
        <span>100 %</span>
      </div>
    </div>
  )
}

// Faithful static reproduction of a context menu (cf. @ui MenuDropdown). The real
// MenuDropdown is a floating positioned popup; here it is shown open and inline.
function MockContextMenu() {
  const item = 'flex items-center gap-3 px-3 py-1.5 text-sm text-text-primary hover:bg-surface-2 cursor-default'
  return (
    <div
      className="w-52 py-1 rounded-lg bg-white border border-border"
      style={{ boxShadow: '0 2px 6px 2px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.18)' }}
    >
      <div className={item}><Download size={15} className="text-text-secondary" /> Télécharger
        <span className="ml-auto text-xs text-text-tertiary">⌘S</span></div>
      <div className={item}><Share2 size={15} className="text-text-secondary" /> Partager</div>
      <div className={item}><Pencil size={15} className="text-text-secondary" /> Renommer</div>
      <div className={item}><Copy size={15} className="text-text-secondary" /> Dupliquer</div>
      <div className="my-1 border-t border-border" />
      <div className={item}><Info size={15} className="text-text-secondary" /> Détails</div>
      <div className="my-1 border-t border-border" />
      <div className="flex items-center gap-3 px-3 py-1.5 text-sm text-danger hover:bg-danger-light cursor-default">
        <Trash2 size={15} /> Supprimer
      </div>
    </div>
  )
}

const noop = () => {}

// Bounded stage that CONFINES overlay primitives (FloatingWindow, dialogs,
// AnchoredPopover) via PortalHostContext: they portal INTO this box and switch to
// host-relative `absolute` positioning, so they cannot escape it. The box is
// `relative; overflow:hidden`; children mount only once the host node exists (so
// nothing flashes into <body> first). Closing is wired to no-ops for the preview.
function PreviewStage({ title, width = 340, height = 260, children }:
  { title: string; width?: number; height?: number; children: ReactNode }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-text-tertiary">{title}</span>
      <div
        ref={setNode}
        className="relative overflow-hidden rounded-xl border border-border bg-surface-1"
        style={{ width, height }}
      >
        <PortalHostContext.Provider value={node}>
          {node && children}
        </PortalHostContext.Provider>
      </div>
    </div>
  )
}

function AnchoredDemo() {
  const ref = useRef<HTMLButtonElement>(null)
  return (
    <div className="p-3">
      <button ref={ref} className="px-3 py-1.5 text-sm rounded-lg border border-border bg-white text-text-primary">
        Élément ancré
      </button>
      <AnchoredPopover anchorRef={ref} open onClose={noop}>
        <div className="w-44 py-1 rounded-lg bg-white border border-border shadow-[0_2px_6px_2px_rgba(0,0,0,.12)]">
          {['Renommer', 'Déplacer', 'Dupliquer', 'Supprimer'].map((l) => (
            <div key={l} className="px-3 py-1.5 text-sm text-text-primary hover:bg-surface-2 cursor-default">{l}</div>
          ))}
        </div>
      </AnchoredPopover>
    </div>
  )
}

function ResizeHandleDemo() {
  const [w, setW] = useState(120)
  return (
    <div className="relative flex h-24 rounded-xl border border-border overflow-hidden bg-white" style={{ width: 300 }}>
      <div className="h-full bg-surface-1 flex items-center justify-center text-xs text-text-tertiary" style={{ width: w }}>
        Panneau
      </div>
      <ResizeHandle position={w} onResize={setW} min={80} max={220} />
      <div className="flex-1 h-full flex items-center justify-center text-xs text-text-tertiary">Contenu</div>
    </div>
  )
}

function StartPageDemo() {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-white" style={{ height: 300 }}>
      <StartPage
        recentItems={[
          { id: '1', name: 'Rapport annuel.docx', subtitle: '30 juin 2026', onClick: noop },
          { id: '2', name: 'Budget.xlsx', subtitle: '28 juin 2026', onClick: noop },
          { id: '3', name: 'Présentation.pptx', subtitle: '21 juin 2026', onClick: noop },
        ]}
        tabs={[
          {
            id: 'modeles',
            label: 'Modèles',
            content: (
              <div className="grid grid-cols-3 gap-3 p-4">
                {['Vierge', 'CV', 'Lettre', 'Facture', 'Rapport', 'Affiche'].map((m) => (
                  <div key={m} className="aspect-[3/4] rounded-lg border border-border bg-surface-1 flex items-end p-2 text-xs text-text-secondary hover:border-primary cursor-pointer">
                    {m}
                  </div>
                ))}
              </div>
            ),
          },
          { id: 'recents', label: 'Récents', content: <div className="p-4 text-sm text-text-tertiary">Vos documents récents…</div> },
        ]}
      />
    </div>
  )
}

// The gallery body holds all the demo state. It is rendered by PreviewFrame's
// nested React root (inside the shadow DOM), so its hooks and event handlers all
// live in that root — clicks, toggles, slider/resize drags resolve correctly.
function GalleryBody({ theme }: { theme: ThemeDef }) {
  const { t } = useTranslation()
  const [chk, setChk] = useState(true)
  const [tgl, setTgl] = useState(true)
  const [sortVal, setSortVal] = useState('name')
  const [slide, setSlide] = useState(60)
  const [dt, setDt] = useState<string | null>(null)
  const [num, setNum] = useState(3)
  const [txt, setTxt] = useState('Notes…')
  const [font, setFont] = useState('Inter')
  const [floatSel, setFloatSel] = useState(true)
  const [tab, setTab] = useState('apercu')
  const [rich, setRich] = useState('<p>Texte <strong>riche</strong></p>')
  const [colField, setColField] = useState('#1a73e8')
  const [swatch, setSwatch] = useState('#1e8e3e')
  const [pick, setPick] = useState('#d93025')
  const [grad, setGrad] = useState<Gradient>(DEFAULT_GRADIENT)

  // Colour pickers follow the previewed theme's light/dark scheme.
  const pickerTheme = theme.color_scheme === 'dark' ? DEFAULT_PICKER_THEME : LIGHT_PICKER_THEME

  return (
    <ThemePreviewContext.Provider value={true}>
      <div data-theme-preview={theme.id}>
        <Accordion className="mt-1" items={[
        { id: 'colors', title: t('admin.t_prev_colors', { defaultValue: 'Couleurs' }), content: (<>
          <div className="flex flex-wrap gap-3">
            <Swatch varName="--color-primary" label="primary" />
            <Swatch varName="--color-surface-0" label="surface" />
            <Swatch varName="--color-surface-2" label="surface-2" />
            <Swatch varName="--color-text-primary" label="texte" />
            <Swatch varName="--color-border" label="bordure" />
            <Swatch varName="--color-danger" label="danger" />
            <Swatch varName="--color-success" label="succès" />
            <Swatch varName="--color-warning" label="alerte" />
          </div>
        </>) },

        { id: 'primitives', title: t('admin.t_prev_primitives', { defaultValue: 'Composants primaires' }), content: (<>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Button variant="primary" size="sm">Primaire</Button>
            <Button variant="secondary" size="sm">Secondaire</Button>
            <Button variant="ghost" size="sm">Ghost</Button>
            <Button variant="danger" size="sm">Danger</Button>
            <Button variant="primary" size="sm" loading>…</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge>Défaut</Badge>
            <Badge variant="success">Succès</Badge>
            <Badge variant="danger">Erreur</Badge>
            <Badge variant="warning">Alerte</Badge>
            <Badge dot variant="primary">En ligne</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-48"><Input placeholder="Champ texte" leftIcon={<Search size={15} />} /></div>
            <Checkbox checked={chk} onChange={setChk} label="Case à cocher" />
            <Radio checked onChange={() => {}} label="Option" />
            <Toggle checked={tgl} onChange={(e) => setTgl(e.target.checked)} label="Bascule" />
            <Spinner size="sm" />
            <Separator orientation="vertical" className="h-6" />
          </div>
          <div className="flex flex-wrap items-center gap-6 mt-4">
            <div className="w-56">
              <span className="block text-xs text-text-tertiary mb-1.5">{t('admin.t_prev_slider', { defaultValue: 'Curseur' })}</span>
              <RangeSlider value={slide} onChange={setSlide} min={0} max={100} />
            </div>
            <div className="w-56">
              <span className="block text-xs text-text-tertiary mb-1.5">{t('admin.t_prev_datetime', { defaultValue: 'Date et heure' })}</span>
              <DatePicker mode="datetime" value={dt} onChange={setDt} placeholder={t('admin.t_prev_pick_dt', { defaultValue: 'Choisir…' })} />
            </div>
          </div>
        </>) },

        { id: 'fields', title: t('admin.t_prev_fields', { defaultValue: 'Champs & saisie' }), content: (<>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-36">
              <NumberInput value={num} onChange={setNum} label={t('admin.t_prev_quantity', { defaultValue: 'Quantité' })} min={0} max={10} />
            </div>
            <div className="w-56">
              <Textarea
                label={t('admin.t_prev_textarea', { defaultValue: 'Zone de texte' })}
                value={txt}
                onChange={(e) => setTxt(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-tertiary">{t('admin.t_prev_font', { defaultValue: 'Police' })}</span>
              <FontPicker value={font} onChange={setFont} fonts={['Inter', 'Georgia', 'Times New Roman', 'Courier New']} />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs text-text-tertiary">{t('admin.t_prev_select_obj', { defaultValue: 'Sélection' })}</span>
              <div className="relative w-10 h-10 rounded-lg bg-surface-2 border border-border">
                <FloatCheckbox selected={floatSel} onToggle={() => setFloatSel((v) => !v)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-tertiary">{t('admin.t_prev_color', { defaultValue: 'Couleur' })}</span>
              <ColorField color={colField} onChange={setColField} C={pickerTheme} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-tertiary">{t('admin.t_prev_gradient', { defaultValue: 'Dégradé' })}</span>
              <GradientField value={grad} onChange={setGrad} C={pickerTheme} />
            </div>
          </div>
        </>) },

        { id: 'tabs', title: t('admin.t_prev_tabs_text', { defaultValue: 'Onglets & texte riche' }), content: (<>
          <div className="space-y-3">
            <Tabs
              tabs={[
                { id: 'apercu', label: t('admin.t_prev_tab_preview', { defaultValue: 'Aperçu' }) },
                { id: 'code', label: 'Code' },
                { id: 'reglages', label: t('admin.t_prev_tab_settings', { defaultValue: 'Réglages' }) },
              ]}
              value={tab}
              onChange={setTab}
            />
            <div className="w-full max-w-md">
              <RichText value={rich} onChange={setRich} placeholder={t('admin.t_prev_write', { defaultValue: 'Écrire…' })} />
            </div>
          </div>
        </>) },

        { id: 'pickers', title: t('admin.t_prev_color_pickers', { defaultValue: 'Sélecteurs de couleur' }), content: (<>
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-tertiary">{t('admin.t_prev_swatches', { defaultValue: 'Nuancier' })}</span>
              <ColorSwatchPicker color={swatch} onChange={setSwatch} theme={pickerTheme} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-tertiary">{t('admin.t_prev_color_picker', { defaultValue: 'Sélecteur de couleur' })}</span>
              <ColorPicker color={pick} onChange={setPick} onClose={() => {}} C={pickerTheme} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-tertiary">{t('admin.t_prev_gradient_picker', { defaultValue: 'Sélecteur de dégradé' })}</span>
              <GradientPicker value={grad} onChange={setGrad} C={pickerTheme} />
            </div>
          </div>
        </>) },

        { id: 'menus', title: t('admin.t_prev_menus', { defaultValue: 'Menus déroulants' }), content: (<>
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-tertiary">{t('admin.t_prev_select', { defaultValue: 'Sélecteur' })}</span>
              <Dropdown
                value={sortVal}
                onChange={setSortVal}
                options={[
                  { value: 'name', label: 'Nom', icon: <FileText size={14} /> },
                  { value: 'date', label: 'Date de modification' },
                  { value: 'size', label: 'Taille' },
                  { value: 'type', label: 'Type' },
                ]}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-tertiary">{t('admin.t_prev_ctxmenu', { defaultValue: 'Menu contextuel' })}</span>
              <MockContextMenu />
            </div>
          </div>
        </>) },

        { id: 'shell', title: t('admin.t_prev_shell', { defaultValue: 'Coquille (core)' }), content: (<>
          <div className="space-y-3">
            <MockTopbar />
            <MockSidebar />
          </div>
        </>) },

        { id: 'ribbon', title: t('admin.t_prev_ribbon', { defaultValue: 'Ruban (Office)' }), content: (<>
          <p className="text-[11px] text-text-tertiary mb-2.5">
            {t('admin.t_prev_ribbon_hint', {
              defaultValue: 'Chrome des éditeurs (bande d’onglets, groupes, barre de statut) — re-skinnée par le thème via les variables workspace.',
            })}
          </p>
          <div className="max-w-xl"><MockRibbon /></div>
        </>) },

        { id: 'drive', title: t('admin.t_prev_drive', { defaultValue: 'Objets du Drive' }), content: (<>
          <MockBreadcrumb />
          {/* `items-start` so the short folder cards keep their natural height
              instead of stretching to the tall file cards (flex default). */}
          <div className="flex flex-wrap items-start gap-3 mt-3">
            <MockFolderCard selected />
            <MockFolderCard name="Images" />
            <MockFileCard selected />
            <MockFileCard name="Budget.xlsx" ext="XLSX" />
          </div>
          <div className="mt-3 rounded-lg border border-border overflow-hidden bg-white">
            <MockFileRow selected />
            <MockFileRow name="Archive.zip" size="18 Mo" />
          </div>
          <div className="flex flex-wrap items-start gap-4 mt-3">
            <MockUploadPanel />
            <div className="flex flex-col items-center justify-center py-8 px-10 text-center gap-2 rounded-xl border-2 border-dashed border-primary bg-primary/5">
              <CloudUpload size={40} className="text-primary opacity-80" />
              <p className="text-primary font-medium text-sm">Déposez vos fichiers ici</p>
            </div>
          </div>
        </>) },

        { id: 'overlays', title: t('admin.t_prev_overlays', { defaultValue: 'Fenêtres & dialogues' }), content: (<>
          <p className="text-[11px] text-text-tertiary mb-2.5 -mt-1">
            {t('admin.t_prev_overlays_hint', {
              defaultValue: 'Confinés à une zone bornée dont ils ne peuvent sortir ; fermeture désactivée pour l’aperçu.',
            })}
          </p>
          <div className="flex flex-wrap items-start gap-4">
            <PreviewStage title={t('admin.t_prev_window', { defaultValue: 'Fenêtre flottante' })} width={360} height={280}>
              <FloatingWindow title="Fenêtre flottante" onClose={noop} defaultWidth={260} minWidth={200} minHeight={120}>
                <div className="p-4 text-sm text-text-secondary">{t('admin.t_prev_window_body', { defaultValue: 'Contenu de la fenêtre.' })}</div>
              </FloatingWindow>
            </PreviewStage>
            <PreviewStage title={t('admin.t_prev_confirm', { defaultValue: 'Boîte de confirmation' })} width={480} height={360}>
              <ConfirmDialog
                title={t('admin.t_prev_confirm_title', { defaultValue: 'Supprimer l’élément ?' })}
                message={t('admin.t_prev_confirm_msg', { defaultValue: 'Cette action est définitive et ne peut pas être annulée.' })}
                variant="danger"
                confirmLabel={t('common.delete', { defaultValue: 'Supprimer' })}
                onConfirm={noop}
                onCancel={noop}
              />
            </PreviewStage>
            <PreviewStage title={t('admin.t_prev_conflict', { defaultValue: 'Conflit de nom' })} width={500} height={440}>
              <ConflictDialog type="file" name="rapport.pdf" onChoice={noop} />
            </PreviewStage>
            <PreviewStage title={t('admin.t_prev_anchored', { defaultValue: 'Menu ancré' })} width={240} height={220}>
              <AnchoredDemo />
            </PreviewStage>
          </div>
        </>) },

        { id: 'layout', title: t('admin.t_prev_layout', { defaultValue: 'Mise en page' }), content: (<>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-tertiary">{t('admin.t_prev_resize', { defaultValue: 'Poignée de redimensionnement' })}</span>
              <ResizeHandleDemo />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-tertiary">{t('admin.t_prev_startpage', { defaultValue: 'Page de démarrage' })}</span>
              <StartPageDemo />
            </div>
          </div>
        </>) },
        ]} />
      </div>
    </ThemePreviewContext.Provider>
  )
}

// Public entry: renders the gallery body inside an isolated Shadow DOM
// (PreviewFrame). The previewed theme's variables AND its global.css apply ONLY
// there, while the live (active) theme is excluded — so the preview reflects the
// selected theme alone and is never tinted by whichever theme is applied to the app.
export default function ThemePreviewGallery({ theme }: { theme: ThemeDef }) {
  return (
    <PreviewFrame theme={theme}>
      <GalleryBody theme={theme} />
    </PreviewFrame>
  )
}
