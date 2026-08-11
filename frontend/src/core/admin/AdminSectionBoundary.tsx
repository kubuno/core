import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@ui'
import { Compass, Lock, ShieldAlert } from 'lucide-react'
import { ADMIN_ROOT } from './adminRoute'

/**
 * "You may not open this section" — the explicit state a refusal must produce.
 *
 * Reached two ways: the tab was filtered out of the navigation and someone typed
 * its URL anyway, or the section itself hit a refusal deeper in. Either way the
 * answer is a sentence, never a blank page.
 */
export function AdminForbidden({ titleKey }: { titleKey?: string }) {
  const { t } = useTranslation()
  return (
    <EmptyState
      variant="unavailable"
      icon={<Lock />}
      title={t('admin.forbidden_title')}
      description={
        titleKey
          ? t('admin.forbidden_desc_section', { section: t(titleKey) })
          : t('admin.forbidden_desc')
      }
      t={t}
    />
  )
}

/**
 * "That address names no section" — what `/admin/nawak` produces.
 *
 * Since the section lives in the PATH, a typo (or a link to a section this build
 * no longer has) is a reachable URL that resolves to nothing. Redirecting to the
 * landing would silently pretend the address was right; a blank page would say
 * nothing at all. This says what happened and offers the way back.
 */
export function AdminSectionNotFound({ tab }: { tab: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <EmptyState
      variant="no-results"
      icon={<Compass />}
      title={t('admin.unknown_section_title')}
      description={t('admin.unknown_section_desc', { section: tab })}
      action={{ label: t('admin.unknown_section_action'), onClick: () => navigate(ADMIN_ROOT) }}
      t={t}
    />
  )
}

function SectionCrashed() {
  const { t } = useTranslation()
  return (
    <EmptyState
      variant="error"
      icon={<ShieldAlert />}
      title={t('admin.section_error_title')}
      description={t('admin.section_error_desc')}
      action={{ label: t('admin.section_error_retry'), onClick: () => window.location.reload() }}
      t={t}
    />
  )
}

/**
 * Keeps one section's failure inside that section.
 *
 * A delegated administrator sees the console but not every surface, and a panel
 * that assumes its data arrived can throw on a refused request. Without this the
 * whole `/admin` route unmounts and the operator gets a white page with no clue
 * what happened — the one outcome a permission refusal must never produce.
 * Re-keyed on the tab id, so navigating away from a broken section recovers.
 */
export default class AdminSectionBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[admin] section crashed', error, info.componentStack)
  }

  render() {
    return this.state.failed ? <SectionCrashed /> : this.props.children
  }
}
