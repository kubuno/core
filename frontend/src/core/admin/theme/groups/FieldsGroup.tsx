import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ColorField, FloatCheckbox, FontPicker, GradientField, NumberInput, Textarea,
  type Gradient, type PickerTheme,
} from '@ui'

/**
 * Input fields (number, textarea, font, colour, gradient). The gradient value is
 * owned by the gallery so this group and the pickers group stay in sync, exactly
 * as before the split.
 */
export default function FieldsGroup({ pickerTheme, grad, setGrad }: {
  pickerTheme: PickerTheme
  grad:        Gradient
  setGrad:     (g: Gradient) => void
}) {
  const { t } = useTranslation()
  const [num, setNum] = useState(3)
  const [txt, setTxt] = useState('Notes…')
  const [font, setFont] = useState('Inter')
  const [floatSel, setFloatSel] = useState(true)
  const [colField, setColField] = useState('#1a73e8')

  return (
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
  )
}
