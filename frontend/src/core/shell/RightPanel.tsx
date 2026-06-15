import { ExternalLink, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useRightPanelStore } from '../store/rightPanelStore'

export default function RightPanel() {
  const { t } = useTranslation()
  const { entries, activeModuleId, closePanel } = useRightPanelStore()
  const navigate = useNavigate()
  const activeEntry = entries.find((e) => e.moduleId === activeModuleId)
  const isOpen = activeModuleId !== null && activeEntry != null

  return (
    <div
      className="flex flex-col overflow-hidden flex-shrink-0 transition-[width] duration-200 ease-in-out rounded-xl"
      style={{ background: 'var(--body-bg)', width: isOpen ? '320px' : '0px' }}
    >
      {isOpen && activeEntry && (
        <>
          <div className="flex items-center gap-1 px-4 h-11 flex-shrink-0 border-b border-border/60">
            <span className="flex-1 text-[11px] font-bold text-text-secondary uppercase tracking-widest truncate">
              {activeEntry.label}
            </span>
            {activeEntry.openPath && (
              <button
                onClick={() => navigate(activeEntry.openPath!)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors text-text-tertiary hover:text-text-secondary"
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                aria-label={t('shell.open')}
              >
                <ExternalLink size={15} />
              </button>
            )}
            <button
              onClick={closePanel}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors text-text-tertiary hover:text-text-secondary"
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              aria-label={t('common.close')}
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <activeEntry.panelComponent />
          </div>
        </>
      )}
    </div>
  )
}
