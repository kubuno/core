/**
 * Code-behind of `TokenScopeList.kbview` (converted from `TokenScopeList.tsx` by @kubuno/views-migrate).
 */
import { useTranslation } from "react-i18next"

import { ViewBase } from './TokenScopeList.kbview'

export type TokenScopeListProps = { scopes: string[] }

export class TokenScopeList extends ViewBase {
  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    return { t }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    this.useStores()
  }

  get show_case_1() {
    return !!(this.props.scopes.length === 0)
  }

  get show_main() {
    return !(this.props.scopes.length === 0)
  }

  /** The rows of the Repeater over `scopes`. */
  get rows_scopes() {
    return this.memo('rows_scopes', [this.props], () => {
      if (!(!(this.props.scopes.length === 0))) return undefined as never
      return this.props.scopes.map((key) => {
      return { key, rowKey: key }
    })
    })
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type TokenScopeListStores = ReturnType<TokenScopeList['useStores']>

export default TokenScopeList.component()
