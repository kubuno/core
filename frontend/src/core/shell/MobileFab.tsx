import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useSidebarStore, resolveActiveSidebarConfig } from '../store/sidebarStore'
import { Slot, SlotRegistry } from '../slots/SlotRegistry'

/**
 * Floating action button (mobile only). On desktop the "New" action lives in the
 * sidebar; on mobile that sidebar is an off-canvas drawer, so the primary create
 * action would be two taps away and hidden. This FAB surfaces the exact same
 * create actions (the active module's `NewActions` component or its
 * `sidebar-new-actions` slot) bottom-right, above the MobileNav.
 */
export default function MobileFab() {
  const { t: tc } = useTranslation()
  const { pathname } = useLocation()
  const { configs } = useSidebarStore()

  const activeConfig = resolveActiveSidebarConfig(configs, pathname)
  // Module gère son propre chrome (éditeurs office/paintsharp) → pas de FAB.
  if (activeConfig?.hideSidebar) return null
  const hasSlotActions = activeConfig != null &&
    SlotRegistry.getSlot('sidebar-new-actions')
      .some((entry) => entry.moduleId === activeConfig.moduleId)
  const showNewButton = !!(activeConfig?.NewActions || hasSlotActions)
  if (!showNewButton) return null

  const NewActionsComponent = activeConfig?.NewActions ?? null
  const label = activeConfig?.newButtonLabelKey
    ? tc(activeConfig.newButtonLabelKey)
    : (activeConfig?.newButtonLabel ?? tc('shell.new'))

  return (
    <div
      data-app-chrome
      className="lg:hidden fixed right-4 z-40"
      style={{ bottom: 'calc(72px + env(safe-area-inset-bottom))' }}
    >
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            aria-label={label}
            className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center
                       shadow-[0_4px_14px_rgba(26,115,232,0.45)] active:scale-95 transition-transform"
          >
            <Plus size={26} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side="top"
            align="end"
            sideOffset={10}
            className="min-w-56 bg-white rounded-xl border border-border shadow-xl py-1 z-[60]"
          >
            {NewActionsComponent ? (
              <NewActionsComponent />
            ) : (
              <Slot name="sidebar-new-actions" />
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
