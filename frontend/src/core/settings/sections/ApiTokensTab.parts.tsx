/**
 * The parts of `ApiTokensTab.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { formatDate } from "../../../core/intl/datetime"
import { Key } from "lucide-react"
import { Callout } from "@ui"
import type { ApiTokensTab } from './ApiTokensTab'

export function Part1({ t, soonest }: { t: NonNullable<ApiTokensTab['tr']>; soonest: NonNullable<ApiTokensTab['soonest']> }) {
  return (
    <Callout variant="warning" title={t('settings.tok_legacy_title')} t={t}>
                <p>{t('settings.tok_legacy_desc')}</p>
                {soonest && (
                  <p className="mt-1 font-medium">
                    {t('settings.tok_legacy_until', {
                      date: formatDate(new Date(soonest), 'dateLong'),
                    })}
                  </p>
                )}
              </Callout>
  )
}

export function Part2({ isExpired, graceOver }: { isExpired: ApiTokensTab['rows_tokens'][number]['isExpired']; graceOver: ApiTokensTab['rows_tokens'][number]['graceOver'] }) {
  return (
    <Key
                          size={15}
                          className={`mt-0.5 shrink-0 ${isExpired || graceOver ? 'text-warning' : 'text-text-tertiary'}`}
                        />
  )
}
