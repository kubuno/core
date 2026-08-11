import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Badge, Button, Checkbox, DatePicker, Input, Radio, RangeSlider, Separator, Spinner, Toggle,
} from '@ui'
import { Search } from 'lucide-react'

/** Buttons, badges, form controls and sliders as re-skinned by the theme. */
export default function PrimitivesGroup() {
  const { t } = useTranslation()
  const [chk, setChk] = useState(true)
  const [tgl, setTgl] = useState(true)
  const [slide, setSlide] = useState(60)
  const [dt, setDt] = useState<string | null>(null)

  return (
    <>
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
    </>
  )
}
