/**
 * Code-behind of `MyDataTab.kbview` (converted from `MyDataTab.tsx` by @kubuno/views-migrate).
 */
import { bind, type MouseEventArgs } from '@kubuno/views'
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useStepper, useToast, type StepDef } from "@ui"
import { errorMessage, useMyExport, useRequestMyExport } from "./api"

import { ViewBase } from './MyDataTab.kbview'
import * as __parts from './MyDataTab.parts'

export class MyDataTab extends ViewBase {
  @bind accessor maxFileMb: number | null = null
  tr!: MyDataTabStores['t']
  i18n!: MyDataTabStores['i18n']
  toast!: MyDataTabStores['toast']
  data!: MyDataTabStores['data']
  isLoading!: boolean
  isError!: boolean
  error!: Error | null
  request!: MyDataTabStores['request']
  selected!: Set<string>
  setSelected!: MyDataTabStores['setSelected']
  steps!: StepDef[]
  stepper!: MyDataTabStores['stepper']
  landed!: MyDataTabStores['landed']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t, i18n } = useTranslation()
    const toast = useToast()
    const { data, isLoading, isError, error } = useMyExport()
    const request = useRequestMyExport()
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const steps: StepDef[] = useMemo(() => [
      { id: 'services', label: t('settings.mde_step_pick',     { defaultValue: 'Choisir les données' }) },
      { id: 'options',  label: t('settings.mde_step_options',  { defaultValue: 'Personnaliser' }) },
      { id: 'download', label: t('settings.mde_step_download', { defaultValue: 'Télécharger' }) },
    ], [t])
    const stepper = useStepper(steps, 'services')
    const landed = useRef(false)
    return { t, i18n, toast, data, isLoading, isError, error, request, selected, setSelected, steps, stepper, landed }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const data = this.data
    const setSelected = this.setSelected
    const landed = this.landed
    useEffect(() => {
      if (!data) return
      setSelected(prev => (prev.size > 0 ? prev : new Set(data.services.map(s => s.id))))
      this.maxFileMb = this.maxFileMb ?? data.policy.max_file_mb
    }, [data])
    useEffect(() => {
      if (landed.current || !data) return
      landed.current = true
      if (this.hasSomething) this.goTo('download')
    }, [data, this.hasSomething, this.goTo])
    return {  }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, i18n: s.i18n, toast: s.toast, data: s.data, isLoading: s.isLoading, isError: s.isError, error: s.error, request: s.request, selected: s.selected, setSelected: s.setSelected, steps: s.steps, stepper: s.stepper, landed: s.landed })
    this.useHooks()
  }

  get goTo() {
    return this.memo('goTo', [this.stepper], () => (this.stepper).goTo)
  }

  get hasSomething(): boolean {
    return !!this.data?.active || !!this.data?.history.some(r => r.status === 'ready' && r.downloadable)
  }

  get show_case_1() {
    return !!(this.isLoading)
  }

  get show_case_2() {
    return !(this.isLoading) && !!(this.isError || !this.data)
  }

  get part1_props() {
    return this.memo('part1_props', [this.error, this.tr, this.isLoading, this.isError, this.data], () => {
      if (!(!(this.isLoading)) || !(this.isError || !this.data)) return undefined as never
      return ({ error: this.error, t: this.tr })
    })
  }

  /** A part of the screen still written in React (<Callout> icon: a value the property converts (null-when-false)). */
  get Part1() {
    if (!(!(this.isLoading)) || !(this.isError || !this.data)) return undefined as never
    return __parts.Part1
  }

  get show_main() {
    return !(this.isLoading) && !(this.isError || !this.data)
  }

  get part2_props() {
    return this.memo('part2_props', [this.stepper, this.goTo, this.hasSomething, this.data, this.selected, this.setSelected, this.maxFileMb, this.memo, this.i18n, this.isLoading, this.isError], () => {
      if (!(!(this.isLoading)) || !(!(this.isError || !this.data))) return undefined as never
      return ({ stepper: this.stepper, goTo: this.goTo, hasSomething: this.hasSomething, data: this.data, selected: this.selected, setSelected: this.setSelected, maxFileMb: this.maxFileMb, setMaxFileMb: this.memo("setMaxFileMb:bound", [], () => this.setMaxFileMb.bind(this)), i18n: this.i18n, startOver: this.memo("startOver:bound", [], () => this.startOver.bind(this)) })
    })
  }

  /** A part of the screen still written in React (<Stepper> steps: no .kbview property). */
  get Part2() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data))) return undefined as never
    return __parts.Part2
  }

  get show_stepper_id_download() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data))) return undefined as never
    return this.stepper.id !== 'download'
  }

  get show_stepper_id_options() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data)) || !(this.stepper.id !== 'download')) return undefined as never
    return this.stepper.id === 'options'
  }

  get show_stepper_id_services() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data)) || !(this.stepper.id !== 'download')) return undefined as never
    return this.stepper.id === 'services'
  }

  get show_not_stepper_id_services() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data)) || !(this.stepper.id !== 'download')) return undefined as never
    return !(this.stepper.id === 'services')
  }

  get enabled_unless_data_active() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data)) || !(this.stepper.id !== 'download') || !(!(this.stepper.id === 'services'))) return undefined as never
    return !(!!this.data.active)
  }

  get show_data_active_stepper() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data)) || !(this.stepper.id !== 'download')) return undefined as never
    return !!this.data.active && this.stepper.id === 'options'
  }

  submit() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data))) return undefined as never
    this.request.mutate(
      {
        services: [...this.selected],
        max_file_mb: this.maxFileMb ?? this.data.policy.max_file_mb,
      },
      {
        onSuccess: () => {
          this.goTo('download')
          this.toast.success(this.tr('settings.mde_requested_ok', {
            defaultValue: 'Demande enregistrée. La préparation commence.',
          }))
        },
        onError: (err) => {
          this.toast.error(errorMessage(err, this.tr('settings.mde_requested_ko', {
            defaultValue: 'La demande n’a pas pu être enregistrée.',
          })))
        },
      },
    )
  }

  startOver() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data))) return undefined as never
    return this.goTo('services')
  }

  button_click(_sender: unknown, _args: MouseEventArgs) {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data)) || !(this.stepper.id !== 'download') || !(this.stepper.id === 'options')) return undefined as never
    return (this.stepper.prev)?.()
  }

  button_click2(_sender: unknown, _args: MouseEventArgs) {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data)) || !(this.stepper.id !== 'download') || !(this.stepper.id === 'services')) return undefined as never
    return (this.stepper.next)?.()
  }

  /** `setMaxFileMb` of the TSX: a value, or an update of the previous one. */
  setMaxFileMb(value: number | null | ((prev: number | null) => number | null)) {
    this.maxFileMb = typeof value === 'function' ? (value as (prev: number | null) => number | null)(this.maxFileMb) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type MyDataTabStores = ReturnType<MyDataTab['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type MyDataTabHooks = ReturnType<MyDataTab['useHooks']>

export default MyDataTab.component()
