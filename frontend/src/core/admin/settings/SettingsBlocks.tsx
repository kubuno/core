// The shape a run of settings is painted in, shared by every mode of the module
// panel so that a category reads the same whether it is a tab, a foldable
// section, or a search result.
//
// It is here rather than inside `ModuleAdminSettings` because that file already
// owns the hard part — the pending edits, the validation, the saving — and a
// panel that renders its rows three different ways in three places is how the
// three quietly drift apart. (The section SHELL moved to
// `SettingSectionCard.tsx`; what is left is the run of rows inside it.)
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
        <div className="border-t border-border">
          <button
            type="button"
            onClick={onToggleAdvanced}
            className="flex w-full items-center gap-2 px-5 py-3 text-left text-text-tertiary transition-colors hover:bg-surface-1 hover:text-text-secondary"
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
