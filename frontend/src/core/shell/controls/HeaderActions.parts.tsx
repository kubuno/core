/**
 * The parts of `HeaderActions.kbcontrol` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { formatRelative } from "../../intl/datetime"
import { Link } from "react-router-dom"
import { Bell, HelpCircle, Info, BookOpen, Calendar, PhoneMissed, PlugZap, type LucideIcon } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { Slot } from "../../slots/SlotRegistry"
import type { HeaderActions } from './HeaderActions'
const NOTIF_ICONS: Record<string, LucideIcon> = { Bell, Calendar, PhoneMissed, PlugZap }

export function Part1({ btn, t, ico, unreadCount, markAllRead, notifications, markRead, navigate }: { btn: NonNullable<HeaderActions['btn']>; t: NonNullable<HeaderActions['tr']>; ico: NonNullable<HeaderActions['ico']>; unreadCount: NonNullable<HeaderActions['unreadCount']>; markAllRead: NonNullable<HeaderActions['markAllRead']>; notifications: NonNullable<HeaderActions['notifications']>; markRead: NonNullable<HeaderActions['markRead']>; navigate: NonNullable<HeaderActions['navigate']> }) {
  return (
    <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className={`${btn} relative`}
                aria-label={t('header.notifications')}
              >
                <Bell size={ico} />
                {/* Counter pinned OUTSIDE the button's top-right corner, never over
                    the glyph: at `top-1.5 right-1.5` a 16px badge sat squarely on
                    the 18px bell and swallowed it. Sitting above the corner also
                    lets a three-digit count widen leftwards without reaching the
                    bell, which is why the "+" only kicks in past 999. */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-[4px] bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none whitespace-nowrap">
                    {unreadCount > 999 ? '999+' : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={4}
                className="w-80 max-h-96 overflow-y-auto bg-white rounded-[5px] border border-border shadow-lg z-[9999] flex flex-col">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border sticky top-0 bg-white z-10">
                  <span className="text-sm font-semibold text-text-primary">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:text-primary-hover transition-colors">
                      {t('header.mark_all_read', { defaultValue: 'Tout lire' })}
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-text-tertiary">
                    {t('header.no_notifications', { defaultValue: 'Aucune notification' })}
                  </div>
                ) : (
                  <div>
                    {notifications.map(notif => (
                      <DropdownMenu.Item key={notif.id}
                        onSelect={() => { markRead(notif.id); if (notif.link) navigate(notif.link) }}
                        className={`flex items-start gap-3 px-3 py-3 cursor-pointer outline-none hover:bg-surface-1 transition-colors border-b border-border/50 last:border-0 ${notif.read ? 'opacity-60' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          {(() => { const Icon = (notif.icon && NOTIF_ICONS[notif.icon]) ? NOTIF_ICONS[notif.icon] : Calendar; return <Icon size={14} className="text-primary" /> })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm leading-snug truncate ${notif.read ? 'font-normal text-text-secondary' : 'font-semibold text-text-primary'}`}>{notif.title}</p>
                            <span className="text-[10px] text-text-tertiary shrink-0 mt-0.5">{formatRelative(new Date(notif.createdAt))}</span>
                          </div>
                          <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">{notif.body}</p>
                        </div>
                      </DropdownMenu.Item>
                    ))}
                  </div>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
  )
}

export function Part2({ SettingsButtonOverride, compact, dark }: { SettingsButtonOverride: NonNullable<HeaderActions['SettingsButtonOverride']>; compact: NonNullable<HeaderActions['compact']>; dark: NonNullable<HeaderActions['dark']> }) {
  return (
    <SettingsButtonOverride compact={compact} dark={dark} />
  )
}

export function Part3({ btn, ico, t }: { btn: NonNullable<HeaderActions['btn']>; ico: NonNullable<HeaderActions['ico']>; t: NonNullable<HeaderActions['tr']> }) {
  return (
    <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className={`${btn} hidden lg:flex`}>
                <HelpCircle size={ico} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={4}
                className="min-w-52 bg-white rounded-[5px] border border-border shadow-lg py-1 z-[9999]">
                <Slot name="help-menu-items" />
                <DropdownMenu.Item asChild>
                  <a href="https://github.com/kubuno/kubuno/wiki" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-1 cursor-pointer outline-none">
                    <BookOpen size={16} className="text-text-secondary" />
                    {t('header.help_link')}
                  </a>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-border mx-2" />
                <DropdownMenu.Item asChild>
                  <Link to="/about"
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-1 cursor-pointer outline-none">
                    <Info size={16} className="text-text-secondary" />
                    {t('header.about')}
                  </Link>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
  )
}
