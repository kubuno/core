import { useState } from 'react'
import { KubunoLogo } from '@ui'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Bell, Settings, LogOut, User as UserIcon, Menu, HelpCircle, Info, UserPlus, ExternalLink } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Avatar from '@radix-ui/react-avatar'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import { Slot, SlotRegistry } from '../slots/SlotRegistry'
import { useModulesStore } from '../store/modulesStore'
import { useLinkedAccountsStore, type LinkedAccount } from '../store/linkedAccountsStore'
import AddAccountModal from '../components/AddAccountModal'

function accountInitials(displayName: string | null, email: string): string {
  if (displayName) return displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

function accountLabel(account: LinkedAccount): string {
  return account.display_name ?? account.email
}

function openLinkedAccount(account: LinkedAccount) {
  window.open(account.instance_url, '_blank', 'noopener,noreferrer')
}

export default function Topbar() {
  const { user, logout } = useAuthStore()
  const { toggleSidebar } = useUiStore()
  const navigate = useNavigate()
  const { accounts, remove } = useLinkedAccountsStore()
  const activeModules = useModulesStore(s => s.activeModules)
  const activeIds = new Set(activeModules.map(m => m.module_id))
  const SettingsButtonOverride = SlotRegistry.getActiveOverride<Record<never, never>>('topbar-settings', activeIds)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = user?.display_name
    ? user.display_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() ?? '?'

  return (
    <header
      className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center px-4 gap-4 bg-white"
      style={{ borderBottom: '1px solid #dadce0', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}
    >
      {/* Hamburger mobile */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden w-9 h-9 flex items-center justify-center text-text-secondary
                   hover:bg-surface-2 rounded-full transition-colors"
        aria-label="Menu"
      >
        <Menu size={20} />
      </button>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0 text-text-primary hover:opacity-80 transition-opacity">
        <KubunoLogo size={24} className="text-primary" />
        <span className="text-lg font-semibold hidden sm:block">Kubuno</span>
      </Link>

      {/* Barre de recherche */}
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            placeholder="Rechercher dans Kubuno"
            className="w-full pl-9 pr-10 py-2 bg-surface-2 rounded-full text-sm text-text-primary
                       placeholder-text-tertiary border border-transparent
                       focus:outline-none focus:bg-white focus:border-border focus:shadow-sm transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary
                           bg-surface-3 px-1.5 py-0.5 rounded hidden sm:block">/</span>
        </div>
      </div>

      {/* Actions droite */}
      <div className="flex items-center gap-1 ml-auto">
        <Slot name="topbar-actions" />

        {/* Notifications */}
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary
                           hover:bg-surface-2 transition-colors relative">
          <Bell size={20} />
        </button>

        {/* Paramètres */}
        {SettingsButtonOverride ? (
          <SettingsButtonOverride />
        ) : (
          <Link
            to="/settings"
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary
                       hover:bg-surface-2 transition-colors"
          >
            <Settings size={20} />
          </Link>
        )}

        {/* Menu Aide */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary
                               hover:bg-surface-2 transition-colors">
              <HelpCircle size={20} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="min-w-48 bg-white rounded-[5px] shadow-lg border border-border py-1 z-50"
            >
              <Slot name="help-menu-items" />
              <DropdownMenu.Item asChild>
                <Link
                  to="/about"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary
                             hover:bg-surface-1 cursor-pointer outline-none"
                >
                  <Info size={16} className="text-text-secondary" />
                  À propos de Kubuno
                </Link>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* User menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1">
              <Avatar.Root className="w-8 h-8 rounded-full overflow-hidden bg-primary flex items-center justify-center">
                {user?.avatar_url ? (
                  <Avatar.Image src={user.avatar_url} alt={user.display_name ?? user.username} className="w-full h-full object-cover" />
                ) : null}
                <Avatar.Fallback className="text-white text-xs font-medium">{initials}</Avatar.Fallback>
              </Avatar.Root>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="min-w-56 bg-white rounded-[5px] shadow-lg border border-border py-1 z-50"
            >
              {/* Compte actif */}
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-text-primary">{user?.display_name ?? user?.username}</p>
                <p className="text-xs text-text-tertiary">{user?.email}</p>
              </div>

              <DropdownMenu.Item asChild>
                <Link to="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary
                                                 hover:bg-surface-1 cursor-pointer outline-none">
                  <UserIcon size={16} className="text-text-secondary" />
                  Profil
                </Link>
              </DropdownMenu.Item>

              <Slot name="user-menu-items" />

              {/* Comptes liés */}
              {accounts.length > 0 && (
                <>
                  <DropdownMenu.Separator className="h-px bg-border my-1" />
                  <p className="px-3 pt-1 pb-0.5 text-xs font-medium text-text-tertiary uppercase tracking-wide">
                    Autres comptes
                  </p>
                  {accounts.map((account) => (
                    <div key={account.id} className="group flex items-center px-3 py-1.5 gap-2 hover:bg-surface-1">
                      <Avatar.Root className="w-7 h-7 rounded-full overflow-hidden bg-surface-3 flex items-center justify-center shrink-0">
                        {account.avatar_url ? (
                          <Avatar.Image src={account.avatar_url} alt={accountLabel(account)} className="w-full h-full object-cover" />
                        ) : null}
                        <Avatar.Fallback className="text-text-secondary text-xs font-medium">
                          {accountInitials(account.display_name, account.email)}
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => openLinkedAccount(account)}
                      >
                        <p className="text-sm text-text-primary truncate">{accountLabel(account)}</p>
                        <p className="text-xs text-text-tertiary truncate">{new URL(account.instance_url).hostname}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openLinkedAccount(account)}
                          className="p-1 rounded hover:bg-surface-2 text-text-tertiary"
                          title="Ouvrir dans un nouvel onglet"
                        >
                          <ExternalLink size={13} />
                        </button>
                        <button
                          onClick={() => remove(account.id)}
                          className="p-1 rounded hover:bg-danger-light text-text-tertiary hover:text-danger"
                          title="Supprimer ce compte"
                        >
                          <LogOut size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              <DropdownMenu.Separator className="h-px bg-border my-1" />

              {/* Ajouter un compte */}
              <DropdownMenu.Item
                onSelect={() => setAddModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary
                           hover:bg-surface-1 cursor-pointer outline-none"
              >
                <UserPlus size={16} className="text-text-secondary" />
                Ajouter un compte
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-border my-1" />

              <DropdownMenu.Item
                onSelect={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-danger
                           hover:bg-danger-light cursor-pointer outline-none"
              >
                <LogOut size={16} />
                Déconnexion
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <AddAccountModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </header>
  )
}
