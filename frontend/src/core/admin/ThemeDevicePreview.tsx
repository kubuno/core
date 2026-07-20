import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Smartphone, Tablet, Monitor } from 'lucide-react'
import ThemePreviewGallery from './ThemePreviewGallery'
import type { ThemeDef } from '../store/themeStore'

type Device = 'mobile' | 'tablet' | 'desktop'

// Largeurs de viewport représentatives. La galerie d'aperçu (flex-wrap) se réagence
// à la largeur → on voit le thème rendu en mobile, tablette et PC.
const DEVICES: { id: Device; Icon: typeof Monitor; w: number | null; labelKey: string; def: string }[] = [
  { id: 'mobile',  Icon: Smartphone, w: 390,  labelKey: 'admin.t_dev_mobile',  def: 'Mobile' },
  { id: 'tablet',  Icon: Tablet,     w: 820,  labelKey: 'admin.t_dev_tablet',  def: 'Tablette' },
  { id: 'desktop', Icon: Monitor,    w: null,  labelKey: 'admin.t_dev_desktop', def: 'PC' },
]

/** Aperçu d'un thème dans un cadre d'appareil (mobile / tablette / PC). */
export default function ThemeDevicePreview({ theme }: { theme: ThemeDef }) {
  const { t } = useTranslation()
  const [device, setDevice] = useState<Device>('desktop')
  const cur = DEVICES.find((d) => d.id === device) ?? DEVICES[2]

  return (
    <div>
      {/* Sélecteur d'appareil */}
      <div className="mb-3 inline-flex items-center gap-0.5 rounded-lg bg-surface-2 p-0.5">
        {DEVICES.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDevice(d.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors
              ${device === d.id ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <d.Icon size={14} />
            {t(d.labelKey, { defaultValue: d.def })}
            {d.w && <span className="text-text-tertiary font-normal">{d.w}px</span>}
          </button>
        ))}
      </div>

      {/* Cadre d'appareil : la galerie se réagence à la largeur choisie. Sur mobile /
          tablette, largeur fixe centrée dans une « coque » ; sur PC, pleine largeur. */}
      <div className="flex justify-center rounded-xl border border-border bg-surface-1 p-4 overflow-x-auto">
        {cur.w ? (
          <div
            className="flex-shrink-0 overflow-hidden rounded-[1.6rem] border-[6px] border-surface-3 bg-white shadow-md"
            style={{ width: cur.w }}
          >
            <ThemePreviewGallery theme={theme} />
          </div>
        ) : (
          <div className="w-full">
            <ThemePreviewGallery theme={theme} />
          </div>
        )}
      </div>
    </div>
  )
}
