import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Callout } from '@ui'
import { useHealthChecks } from './useHealthChecks'
import { adminUrl } from '../adminAction'

/**
 * The banner every administration page carries while something is wrong.
 *
 * Two rules, and the difference between them is the whole design:
 *
 *  • **A critical finding cannot be dismissed.** A default administrator
 *    password or an unencrypted instance is not a notification; it is the state
 *    of the instance, and it stays on screen until it is no longer true.
 *  • **A warning can be snoozed**, for [`SNOOZE_DAYS`] days. An operator who has
 *    read it and planned the work should not be nagged on every page — but the
 *    silence expires on its own, because a warning nobody ever sees again is a
 *    warning that was never raised.
 *
 * The snooze is per-browser (`localStorage`), deliberately: it is a reading
 * convenience, not a decision about the instance. Deciding that a finding does
 * not apply is what "ignore" is for, and that one is stored server-side with
 * its author and audited.
 */
const SNOOZE_KEY = 'kubuno:health-banner-snoozed-until'
const SNOOZE_DAYS = 7

function snoozedUntil(): number {
  try {
    const raw = window.localStorage.getItem(SNOOZE_KEY)
    return raw ? Number(raw) || 0 : 0
  } catch {
    // Private mode, storage disabled: the banner simply always shows, which is
    // the safe direction to fail in.
    return 0
  }
}

function snooze() {
  try {
    window.localStorage.setItem(
      SNOOZE_KEY,
      String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000),
    )
  } catch { /* nothing to do: the banner comes back on the next page */ }
}

export default function CriticalBanner({ tab }: { tab: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data } = useHealthChecks()
  const [snoozedAt, setSnoozedAt] = useState(() => snoozedUntil())

  const onSnooze = useCallback(() => {
    snooze()
    setSnoozedAt(snoozedUntil())
  }, [])

  // The health page shows the same findings in full. Repeating them in a banner
  // above the list is noise, not emphasis.
  if (!data || tab === 'security-health') return null

  const { critical, warning } = data.counts
  const open = () => navigate(adminUrl({ tab: 'security-health' }))

  if (critical > 0) {
    return (
      <Callout
        className="mb-4"
        variant="danger"
        title={t('admin.hc_banner_critical_title', { n: critical })}
        action={{ label: t('admin.hc_banner_open'), onClick: open }}
      >
        {t('admin.hc_banner_critical_body')}
      </Callout>
    )
  }

  if (warning > 0 && Date.now() >= snoozedAt) {
    return (
      <Callout
        className="mb-4"
        variant="warning"
        title={t('admin.hc_banner_warning_title', { n: warning })}
        action={{ label: t('admin.hc_banner_open'), onClick: open }}
        dismissible
        onDismiss={onSnooze}
      >
        {t('admin.hc_banner_warning_body', { days: SNOOZE_DAYS })}
      </Callout>
    )
  }

  return null
}
