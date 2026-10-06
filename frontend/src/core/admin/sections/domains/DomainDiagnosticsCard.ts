/**
 * Code-behind of `DomainDiagnosticsCard.kbview` (converted from `DomainDiagnosticsCard.tsx` by @kubuno/views-migrate).
 */
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { ExtensionRegistry } from "../../../registry/ExtensionRegistry"
import { DOMAIN_DIAGNOSTICS, type DomainDiagnosticsProvider } from "../../../registry/domainDiagnostics"
import { type Domain } from "./api"

import { ViewBase } from './DomainDiagnosticsCard.kbview'
import * as __parts from './DomainDiagnosticsCard.parts'

export type DomainDiagnosticsCardProps = {
  domain:    Domain
  canManage: boolean
}

export class DomainDiagnosticsCard extends ViewBase {
  tr!: DomainDiagnosticsCardStores['t']
  report!: DomainDiagnosticsCardHooks['report']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    return { t }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const report = useQuery({
      queryKey: ['admin-domain-diagnostics', this.props.domain.name],
      enabled:  !!this.provider,
      // Nothing here is ours to cache: this is read right after editing a zone,
      // and a cached answer would say the edit did not take.
      staleTime: 0,
      retry: false,
      refetchOnWindowFocus: false,
      queryFn: () => (this.provider as DomainDiagnosticsProvider).fetch(this.props.domain.name),
    })
    this.publish({ report })
    return { report }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t })
    const h = this.useHooks()
    this.publish({ report: h.report })
  }

  get provider(): DomainDiagnosticsProvider {
    return this.memo('provider', [], () => ExtensionRegistry.getAll<DomainDiagnosticsProvider>(DOMAIN_DIAGNOSTICS)[0] ?? null)
  }

  get data() {
    return this.memo('data', [this.report], () => this.report.data ?? null)
  }

  get covered(): boolean {
    return !!this.data?.covered
  }

  get showOwnReading(): boolean {
    return !this.covered
  }

  get part1_props() {
    return this.memo('part1_props', [this.tr, this.provider, this.report, this.covered, this.data, this.showOwnReading, this.props], () => ({ t: this.tr, provider: this.provider, report: this.report, covered: this.covered, data: this.data, data_href: this.data?.href, data_note: this.data?.note, showOwnReading: this.showOwnReading, domain: this.props.domain, canManage: this.props.canManage }))
  }

  /** A part of the screen still written in React (<Card> title: an object value for a text property). */
  get Part1() {
    return __parts.Part1
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type DomainDiagnosticsCardStores = ReturnType<DomainDiagnosticsCard['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type DomainDiagnosticsCardHooks = ReturnType<DomainDiagnosticsCard['useHooks']>

export default DomainDiagnosticsCard.component()
