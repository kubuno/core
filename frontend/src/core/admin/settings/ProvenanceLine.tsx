import { useTranslation } from 'react-i18next'
import { CornerDownRight, Lock, MoreVertical, Pencil } from 'lucide-react'
import { MenuDropdown, useMenuDropdown, type MenuItem } from '@ui'
import { useUiTheme } from '../../hooks/useUiTheme'
import type { ResolvedSetting, ScopeType } from './scopeTypes'

/** Human name of a level: the unit/group/account name, or the level itself. */
export function scopeLabel(
  t: (k: string, o?: Record<string, unknown>) => string,
  scopeType: ScopeType | undefined,
  name: string | null | undefined,
): string {
  if (name) return name
  switch (scopeType) {
    case 'instance': return t('admin.scope_instance')
    case 'default':  return t('admin.scope_factory')
    case 'org_unit': return t('admin.scope_org_unit')
    case 'group':    return t('admin.scope_group')
    case 'user':     return t('admin.scope_user')
    default:         return t('admin.scope_factory')
  }
}

/**
 * The one-line provenance statement printed under every control.
 *
 * Three mutually exclusive states, and they are the whole point of the feature:
 * *inherited from X* (the value follows X and will keep following it),
 * *overridden here* (this scope holds its own row), *locked by X* (a level above
 * decided, and the control above this line is disabled).
 */
export default function ProvenanceLine({
  setting, onRevert, onLock, onShowChain,
}: {
  setting:     ResolvedSetting
  onRevert:    () => void
  onLock:      (locked: boolean) => void
  onShowChain: () => void
}) {
  const { t } = useTranslation()
  const menu = useMenuDropdown()
  const theme = useUiTheme()

  const locked   = setting.locked_above
  const own      = setting.has_own_value && !locked
  const fromName = scopeLabel(t, setting.source?.scope_type, setting.source?.scope_name)
  const lockName = scopeLabel(t, setting.lock_source?.scope_type, setting.lock_source?.scope_name)

  const items: MenuItem[] = [
    {
      type: 'action',
      label: t('admin.setting_revert'),
      icon: <CornerDownRight size={15} />,
      // Nothing to revert when the value is already inherited, and a lock above
      // forbids touching this level at all.
      disabled: !setting.has_own_value || locked,
      onClick: onRevert,
    },
    {
      type: 'action',
      label: setting.locked_here ? t('admin.setting_unlock') : t('admin.setting_lock'),
      icon: <Lock size={15} />,
      // Locking pins a value for the levels below, so there must be one here.
      disabled: locked || (!setting.locked_here && !setting.has_own_value),
      onClick: () => onLock(!setting.locked_here),
    },
    { type: 'separator' },
    { type: 'action', label: t('admin.setting_chain'), onClick: onShowChain },
  ]

  return (
    <div className="mt-2 flex items-start gap-2">
      <p className="min-w-0 flex-1 text-xs leading-5 text-text-tertiary">
        {/* The accent colour carries the state through the ICON only. Painting
            this sentence in `--color-warning` (#f9ab00) would put amber on the
            card's own surface at roughly 2:1 — the same contrast failure
            `@ui/Callout` documents, and this line is 12px. */}
        {locked ? (
          <span className="inline-flex items-center gap-1 text-text-secondary">
            <Lock size={12} className="shrink-0 text-warning" />
            {t('admin.prov_locked', { scope: lockName })}
          </span>
        ) : own ? (
          <span className="inline-flex items-center gap-1 text-primary">
            <Pencil size={12} className="shrink-0" />
            {t('admin.prov_overridden')}
            {setting.locked_here && (
              <span className="inline-flex items-center gap-1 text-text-secondary">
                <Lock size={12} className="shrink-0 text-warning" />
                {t('admin.prov_locked_here')}
              </span>
            )}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <CornerDownRight size={12} className="shrink-0" />
            {t('admin.prov_inherited', { scope: fromName })}
          </span>
        )}

        {/* Editing the instance while lower scopes hold their own value is the
            classic "why did nothing change" trap: name the count up front. */}
        {setting.overrides.length > 0 && (
          <>
            {' · '}
            <button
              type="button"
              onClick={onShowChain}
              className="underline decoration-dotted underline-offset-2 hover:text-text-secondary"
            >
              {t('admin.prov_overridden_by', { count: setting.overrides.length })}
            </button>
          </>
        )}
      </p>

      <button
        type="button"
        onClick={menu.open}
        aria-label={t('admin.setting_menu')}
        className="-mt-0.5 shrink-0 rounded p-1 text-text-tertiary hover:bg-surface-2 hover:text-text-primary"
      >
        <MoreVertical size={16} />
      </button>

      {menu.pos && (
        <MenuDropdown items={items} pos={menu.pos} onClose={menu.close} theme={theme} />
      )}
    </div>
  )
}
