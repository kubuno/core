import { useTranslation } from 'react-i18next'
import { Dropdown } from '@ui'
import {
  useAppearanceStore, APPEARANCE_DEFAULT, APPEARANCE_SCHEMES, APPEARANCE_DENSITIES,
  type AppearanceMode,
} from '../store/appearanceStore'

/* "Apparence" dialog — per-module light/dark/system + colour scheme + density.
 * Edits apply live to the module's `[data-module]` container (ModuleArea reads the
 * same store), and persist per module (appearanceStore → localStorage). */

// Miniature window mock shown on each mode card (like the Google reference).
function ModeMock({ variant }: { variant: 'light' | 'dark' | 'system' }) {
  const dark  = variant === 'dark'
  const bg    = dark ? '#202124' : '#ffffff'
  const line  = dark ? '#5f6368' : '#dadce0'
  const half  = variant === 'system'
  return (
    <div className="relative w-full h-24 rounded-lg overflow-hidden border border-black/10" style={{ background: bg }}>
      {half && <div className="absolute inset-y-0 right-0 w-1/2" style={{ background: '#202124' }} />}
      <div className="absolute top-2 left-2 w-5 h-5 rounded bg-primary text-white text-[9px] font-bold flex items-center justify-center">31</div>
      <div className="absolute top-8 left-2 right-2 h-4 rounded-full bg-white border border-black/10 flex items-center px-1.5 gap-1">
        <span className="text-black text-[10px] leading-none">＋</span>
        <span className="flex-1 h-px" style={{ background: line }} />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="absolute left-2 right-2 h-px" style={{ top: 56 + i * 8, background: line }} />
      ))}
    </div>
  )
}

export default function AppearanceDialog({ moduleId, onClose }: { moduleId: string; onClose: () => void }) {
  const { t } = useTranslation()
  const current = useAppearanceStore((s) => s.byModule[moduleId]) ?? APPEARANCE_DEFAULT
  const setPref = useAppearanceStore((s) => s.set)

  const modes: { id: AppearanceMode; label: string; variant: 'light' | 'dark' | 'system' }[] = [
    { id: 'light',  label: t('appearance.light',  { defaultValue: 'Clair' }),                     variant: 'light' },
    { id: 'dark',   label: t('appearance.dark',   { defaultValue: 'Sombre' }),                    variant: 'dark' },
    { id: 'system', label: t('appearance.system', { defaultValue: "Paramètre par défaut de l'appareil" }), variant: 'system' },
  ]

  const schemeOptions = APPEARANCE_SCHEMES.map((v) => ({ value: v, label: t(`appearance.scheme_${v}`, { defaultValue: v }) }))
  const densityOptions = APPEARANCE_DENSITIES.map((v) => ({ value: v, label: t(`appearance.density_${v}`, { defaultValue: v }) }))

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-black/30" aria-hidden />
      <div
        role="dialog" aria-modal="true" aria-label={t('appearance.title', { defaultValue: 'Apparence' })}
        onMouseDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-[640px] rounded-2xl p-6 shadow-2xl"
        style={{ background: 'var(--body-bg)' }}
      >
        <h2 className="text-lg font-normal text-text-primary mb-5">{t('appearance.title', { defaultValue: 'Apparence' })}</h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {modes.map((m) => {
            const active = current.mode === m.id
            return (
              <button
                key={m.id}
                onClick={() => setPref(moduleId, { mode: m.id })}
                className={`text-left rounded-xl p-2 transition-colors ${active ? 'bg-primary-light' : 'hover:bg-surface-2'}`}
              >
                <ModeMock variant={m.variant} />
                <div className="flex items-center gap-2 mt-2 px-1">
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${active ? 'border-primary' : 'border-border-strong'}`}>
                    {active && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </span>
                  <span className="text-xs text-text-primary leading-tight">{m.label}</span>
                </div>
              </button>
            )
          })}
        </div>

        <label className="block rounded-lg bg-surface-2 px-4 py-2.5 mb-3">
          <span className="block text-[11px] text-text-secondary mb-1">{t('appearance.scheme', { defaultValue: 'Jeu de couleurs' })}</span>
          <Dropdown value={current.scheme} onChange={(v) => setPref(moduleId, { scheme: v })} options={schemeOptions} width="100%" variant="ghost" height={28} />
        </label>

        <label className="block rounded-lg bg-surface-2 px-4 py-2.5">
          <span className="block text-[11px] text-text-secondary mb-1">{t('appearance.density', { defaultValue: "Densité d'informations" })}</span>
          <Dropdown value={current.density} onChange={(v) => setPref(moduleId, { density: v })} options={densityOptions} width="100%" variant="ghost" height={28} />
        </label>

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="text-sm font-medium text-primary hover:text-primary-hover px-2 py-1">
            {t('common.done', { defaultValue: 'Terminé' })}
          </button>
        </div>
      </div>
    </div>
  )
}
