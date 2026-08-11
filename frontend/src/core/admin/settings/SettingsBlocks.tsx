// The two shapes a run of settings is painted in, shared by every mode of the
// module panel so that a category reads the same whether it is a tab, a
// collapsible section, or a search result.
//
// They are here rather than inside `ModuleAdminSettings` because that file
// already owns the hard part — the pending edits, the validation, the saving —
// and a panel that renders its rows three different ways in three places is how
// the three quietly drift apart.
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { SettingItem } from './moduleSettingSchema'

/**
 * A run of rows, plus the "Avancé" disclosure that holds back the expert knobs.
 *
 * The disclosure is not decoration: `mail` declares nearly a third of its
 * settings `advanced`, and showing them by default is the difference between a
 * page an operator reads and one they scroll past.
 */
export function SettingRows({ basic, advanced, advancedOpen, onToggleAdvanced, renderRow }: {
  basic:            SettingItem[]
  advanced:         SettingItem[]
  advancedOpen:     boolean
  onToggleAdvanced: () => void
  renderRow:        (item: SettingItem) => ReactNode
}) {
  const { t } = useTranslation()
  return (
    <>
      {basic.map(renderRow)}
      {advanced.length > 0 && (
        <div className={basic.length > 0 ? 'border-t border-border' : ''}>
          <button
            type="button"
            onClick={onToggleAdvanced}
            className="w-full flex items-center gap-2 py-2.5 text-left text-text-tertiary hover:text-text-secondary transition-colors"
            style={{ fontSize: 'var(--kb-text-meta)' }}
          >
            {advancedOpen ? <ChevronDown size={14} className="flex-shrink-0" />
                          : <ChevronRight size={14} className="flex-shrink-0" />}
            {t('admin.m_advanced', {
              count: advanced.length,
              defaultValue: `Avancé (${advanced.length})`,
            })}
          </button>
          {advancedOpen && advanced.map(renderRow)}
        </div>
      )}
    </>
  )
}

/**
 * A category as a collapsible section — the panel of a module that declares no
 * page, and the way a search result announces where it was found.
 *
 * The title is plain 14px bold: no small caps, no accent bar.
 */
export function CollapsibleCategory({ title, aside, count, changed, collapsed, onToggle, children }: {
  title:     ReactNode
  /** Rendered right after the title, muted — "where this lives", typically. */
  aside?:    ReactNode
  count:     number
  /** How many of these differ from their factory value. 0 shows nothing. */
  changed:   number
  collapsed: boolean
  onToggle:  () => void
  children:  ReactNode
}) {
  const { t } = useTranslation()
  return (
    <section className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 py-3 text-left hover:text-text-primary transition-colors"
      >
        {collapsed ? <ChevronRight size={16} className="flex-shrink-0" />
                   : <ChevronDown size={16} className="flex-shrink-0" />}
        <span className="text-sm font-bold text-text-secondary">{title}</span>
        {aside}
        <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-micro)' }}>
          {count}
        </span>
        {changed > 0 && (
          <span className="ml-auto text-primary" style={{ fontSize: 'var(--kb-text-micro)' }}>
            {t('admin.m_section_modified', {
              count: changed,
              defaultValue: `${changed} modifié(s)`,
            })}
          </span>
        )}
      </button>
      {!collapsed && children}
    </section>
  )
}
