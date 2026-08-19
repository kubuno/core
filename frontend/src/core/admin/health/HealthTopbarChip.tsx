import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, OctagonAlert, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useHealthChecks } from './useHealthChecks'
import { adminUrl } from '../adminAction'
import { SNOOZE_DAYS, isSnoozed, snooze } from './snooze'

/**
 * Instance health, as a single line in the top bar.
 *
 * It used to be a full-width callout stacked above every administration page:
 * three lines of chrome pushing the actual page down, repeated on every
 * navigation. The same three pieces of information — how many findings, how to
 * open them, how to silence a warning — fit on one line, so they live in the
 * band that was empty anyway.
 *
 * Nothing was dropped to make it fit and no text was shrunk: the count and the
 * link keep the body size, and the sentence about the seven-day snooze became
 * the dismiss button's tooltip, where it is read at the moment it applies.
 */
export default function HealthTopbarChip() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = useAuthStore(s => s.user)
  const [snoozedAt, setSnoozedAt] = useState(() => isSnoozed())

  // Mounted by the shell, so it must decide for itself when it is relevant:
  // administration pages only, administrators only. The health page itself
  // already lists every finding — an indicator pointing at the open page is
  // noise.
  const relevant =
    user?.role === 'admin' &&
    pathname.startsWith('/admin') &&
    !pathname.includes('security-health')

  const { data } = useHealthChecks(relevant)

  const onSnooze = useCallback(() => {
    snooze()
    setSnoozedAt(isSnoozed())
  }, [])

  if (!relevant || !data) return null

  const { critical, warning } = data.counts
  const open = () => navigate(adminUrl({ tab: 'security-health' }))

  // A critical finding is the state of the instance, not a notification: it
  // cannot be dismissed. A warning can be silenced for a while.
  const isCritical = critical > 0
  if (!isCritical && (warning === 0 || snoozedAt)) return null

  const Icon = isCritical ? OctagonAlert : AlertTriangle
  // Severity is carried by the ICON and the BORDER, never by the text colour.
  // The warning token is a mid-yellow: set on a pale yellow fill it read at
  // roughly 2:1 against its own background — a state nobody can read is not a
  // state. The label sits on the plain surface in primary text instead, which
  // holds up on the header's grey and in both themes.
  // Plain tokens, no alpha: a skin may remap any of them, and a translucent
  // theme colour over an unknown surface is a muddy band rather than a state.
  const tone = isCritical ? 'border-danger' : 'border-warning'

  return (
    <div
      className={`hidden md:flex min-w-0 items-center gap-2 rounded-full border ${tone}
                  bg-surface-0 py-1 pl-3 pr-1.5 shadow-sm`}
      style={{ fontSize: 'var(--kb-text-body)' }}
      role="status"
    >
      <Icon size={16} className={`shrink-0 ${isCritical ? 'text-danger' : 'text-warning'}`} />
      <span className="truncate font-medium text-text-primary">
        {isCritical
          ? t('admin.hc_banner_critical_title', { n: critical })
          : t('admin.hc_banner_warning_title', { n: warning })}
      </span>
      <button
        type="button"
        onClick={open}
        className="shrink-0 whitespace-nowrap text-primary underline underline-offset-2
                   hover:no-underline"
      >
        {t('admin.hc_banner_open')}
      </button>
      {!isCritical && (
        <button
          type="button"
          onClick={onSnooze}
          // The sentence the banner used to spell out, kept where it applies.
          title={t('admin.hc_banner_warning_body', { days: SNOOZE_DAYS })}
          aria-label={t('admin.hc_banner_warning_body', { days: SNOOZE_DAYS })}
          className="ml-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full
                     text-text-secondary transition-colors hover:bg-surface-2
                     hover:text-text-primary"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
