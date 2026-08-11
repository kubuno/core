import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ColorPicker, ColorSwatchPicker, GradientPicker, type Gradient, type PickerTheme,
} from '@ui'

/** Swatch grid, full colour picker and gradient picker (open, inline). */
export default function PickersGroup({ pickerTheme, grad, setGrad }: {
  pickerTheme: PickerTheme
  grad:        Gradient
  setGrad:     (g: Gradient) => void
}) {
  const { t } = useTranslation()
  const [swatch, setSwatch] = useState('#1e8e3e')
  const [pick, setPick] = useState('#d93025')

  return (
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
  )
}
