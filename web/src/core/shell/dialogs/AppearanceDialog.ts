/**
 * Code-behind of `AppearanceDialog.kbview` (converted from `AppearanceDialog.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views'
import { useTranslation } from "react-i18next"
import { useAppearanceStore, APPEARANCE_DEFAULT, APPEARANCE_SCHEMES, APPEARANCE_DENSITIES, type AppearanceMode } from "../../store/appearanceStore"

import { ViewBase } from './AppearanceDialog.kbview'
import * as __parts from './AppearanceDialog.parts.tsx'

export type AppearanceDialogProps = { moduleId: string; onClose: () => void }

export class AppearanceDialog extends ViewBase {
  tr!: AppearanceDialogStores['t']
  setPref!: AppearanceDialogStores['setPref']
  current!: typeof APPEARANCE_DEFAULT

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const setPref = useAppearanceStore((s) => s.set)
    return { t, setPref }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, setPref: s.setPref })
    // A store hook reading a prop: run on every render, in order (React's rules), like the TSX's `const current = …`.
    const current = useAppearanceStore((st) => st.byModule[this.props.moduleId]) ?? APPEARANCE_DEFAULT
    this.publish({ current })
  }

  get modes(): { id: AppearanceMode; label: string; variant: 'light' | 'dark' | 'system' }[] {
    return this.memo('modes', [this.tr], () => [
    { id: 'light',  label: this.tr('appearance.light',  { defaultValue: 'Clair' }),                     variant: 'light' },
    { id: 'dark',   label: this.tr('appearance.dark',   { defaultValue: 'Sombre' }),                    variant: 'dark' },
    { id: 'system', label: this.tr('appearance.system', { defaultValue: "Paramètre par défaut de l'appareil" }), variant: 'system' },
  ])
  }

  get schemeOptions() {
    return this.memo('schemeOptions', [this.tr], () => APPEARANCE_SCHEMES.map((v) => ({ value: v, label: this.tr(`appearance.scheme_${v}`, { defaultValue: v }) })))
  }

  get densityOptions() {
    return this.memo('densityOptions', [this.tr], () => APPEARANCE_DENSITIES.map((v) => ({ value: v, label: this.tr(`appearance.density_${v}`, { defaultValue: v }) })))
  }

  /** `<ModeMock>`, rendered by a ReactHost. */
  get ModeMock() {
    return __parts.ModeMock
  }

  /** The rows of the Repeater over `modes`. */
  get rows_modes() {
    return this.memo('rows_modes', [this.modes, this.current], () => this.modes.map((m) => {
      const active = this.current.mode === m.id
      return { m, active, button_class: `text-left rounded-xl p-2 transition-colors ${active ? 'bg-primary-light' : 'hover:bg-surface-2'}`, mode_mock_props: { variant: m.variant }, span_class: `w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${active ? 'border-primary' : 'border-border-strong'}`, key: m.id }
    }))
  }

  get part1_props() {
    return this.memo('part1_props', [this.current, this.setPref, this.props, this.schemeOptions], () => ({ current: this.current, setPref: this.setPref, moduleId: this.props.moduleId, schemeOptions: this.schemeOptions }))
  }

  /** A part of the screen still written in React (<Dropdown> width, height: no .kbview property). */
  get Part1() {
    return __parts.Part1
  }

  get part2_props() {
    return this.memo('part2_props', [this.current, this.setPref, this.props, this.densityOptions], () => ({ current: this.current, setPref: this.setPref, moduleId: this.props.moduleId, densityOptions: this.densityOptions }))
  }

  /** A part of the screen still written in React (<Dropdown> width, height: no .kbview property). */
  get Part2() {
    return __parts.Part2
  }

  stack_mouse_down(_sender: unknown, _args: MouseEventArgs) {
    this.props.onClose?.()
  }

  panel_mouse_down(_sender: unknown, args: MouseEventArgs) {
    const e = args.native as MouseEvent
    e.stopPropagation()
  }

  panel_click(_sender: unknown, args: MouseEventArgs) {
    const { m } = args.row as RowOf_rows_modes
    this.setPref(this.props.moduleId, { mode: m.id })
  }

  panel_click2(_sender: unknown, _args: MouseEventArgs) {
    this.props.onClose?.()
  }

}

type RowOf_rows_modes = AppearanceDialog['rows_modes'][number]

/** What `useStores()` gives (the types of the fields it fills). */
export type AppearanceDialogStores = ReturnType<AppearanceDialog['useStores']>

export default AppearanceDialog.component()
