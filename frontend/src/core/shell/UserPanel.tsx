import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, LogOut, UserPlus, X, ExternalLink, ChevronDown, ChevronUp, Shield, Tag } from 'lucide-react'
import * as Avatar from '@radix-ui/react-avatar'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore, unreadCountOf } from '../store/notificationStore'
import { usePrivileges } from '../authz/usePrivileges'
import { useLinkedAccountsStore } from '../store/linkedAccountsStore'
import { api } from '../api/client'
import { authApi, type BrowserAccount } from '../api/auth'
import AvatarCropModal, { type AvatarCrop } from '@ui/AvatarCropModal'
import { Button } from '@ui'

interface Props {
  open: boolean
  onClose: () => void
  /** Opens the add-account modal; `prefill` re-connects a « Déconnecté » row. */
  onAddAccount: (prefill?: { email: string; slot: number }) => void
  anchorRef: React.RefObject<HTMLElement | null>
}

const initialsOf = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

// Google-style account panel: the active account's hero (avatar, greeting,
// « Gérer votre compte »), then the OTHER accounts signed into this browser —
// click a row to switch, dead sessions show « Déconnecté » with re-connect —
// then remote-instance accounts, add-account and sign-out. The roster comes
// from `GET /auth/accounts` (the server's own slot cookies), nothing local.
export default function UserPanel({ open, onClose, onAddAccount, anchorRef }: Props) {
  const { t } = useTranslation()
  const { user, logout, logoutAll, switchAccount, updateUser } = useAuthStore()
  const { isAdmin } = usePrivileges()
  const { accounts: remoteAccounts, remove: removeRemote } = useLinkedAccountsStore()
  // Per-account notification buckets: each row shows ITS account's unread
  // count (last known while that account was active) — never the active one's.
  const notifByUser = useNotificationStore(s => s.byUser)
  const dropNotifUser = useNotificationStore(s => s.dropUser)
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)

  const [accountsExpanded, setAccountsExpanded] = useState(true)
  const [uploading, setUploading]               = useState(false)
  const [cropOpen, setCropOpen]                 = useState(false)
  const [browserAccounts, setBrowserAccounts]   = useState<BrowserAccount[]>([])
  const [switching, setSwitching]               = useState(false)
  // Compact sticky header once the hero scrolls away (Google's behaviour).
  const [scrolled, setScrolled] = useState(false)

  // The cookie jar is the roster: (re)read it every time the panel opens.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    authApi.accounts()
      .then(({ data }) => { if (!cancelled) setBrowserAccounts(data.accounts) })
      .catch(() => { /* panel still renders without the list */ })
    return () => { cancelled = true }
  }, [open])

  // Close on outside click — désactivé tant que la modale de recadrage est ouverte
  // (elle est portalée hors du panneau ; sans ça, cliquer dedans fermerait le panneau).
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (cropOpen) return
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose, anchorRef, cropOpen])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !cropOpen) onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose, cropOpen])

  if (!open || !user) return null

  const initials = user.display_name ? initialsOf(user.display_name) : user.username.slice(0, 2).toUpperCase()
  const others = browserAccounts.filter(a => !a.active)

  // Recadrage validé → upload du blob découpé (+ original si nouvellement importé)
  const handleCropSave = async (blob: Blob, original: File | null, crop: AvatarCrop) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', blob, 'avatar.jpg')
      if (original) fd.append('original', original, original.name || 'original')
      const res = await api.post<{ user: typeof user }>('/me/avatar', fd)
      // Mémoriser le recadrage (zoom + position) pour la prochaine ouverture
      const pr = await api.patch<{ user: typeof user }>('/me', { preferences: { avatar_crop: crop } })
      // Cache-bust : même URL d'avatar → forcer le navigateur à recharger l'image immédiatement
      const url = res.data.user.avatar_url
      updateUser({
        avatar_url: url ? `${url.split('?')[0]}?v=${Date.now()}` : null,
        preferences: pr.data.user.preferences,
      })
      setCropOpen(false)
    } catch {
      // silently ignore
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = async () => {
    onClose()
    await logout()
    navigate('/login')
  }

  const handleLogoutAll = async () => {
    onClose()
    await logoutAll()
    navigate('/login')
  }

  const doSwitch = async (account: BrowserAccount) => {
    if (switching) return
    setSwitching(true)
    try {
      await switchAccount(account.slot) // hard-reloads on success
    } catch {
      // Session died since the list was read → the row becomes « Déconnecté ».
      setBrowserAccounts(prev =>
        prev.map(a => (a.slot === account.slot ? { ...a, connected: false } : a)))
      setSwitching(false)
    }
  }

  const removeSlot = async (slot: number) => {
    try { await authApi.logout({ slot }) } catch { /* best effort */ }
    const removed = browserAccounts.find(a => a.slot === slot)
    if (removed) dropNotifUser(removed.user.id)
    setBrowserAccounts(prev => prev.filter(a => a.slot !== slot))
  }

  // One same-instance account row. Connected rows are one click away from a
  // switch; dead ones show the badge + « Connexion » / « Supprimer », like Google.
  const accountRow = (account: BrowserAccount) => {
    const label = account.user.display_name ?? account.user.email
    const avatar = (
      <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden bg-surface-3 flex items-center justify-center shrink-0">
        {account.user.avatar_url
          ? <Avatar.Image src={account.user.avatar_url} alt={label} className="w-full h-full object-cover" />
          : null}
        <Avatar.Fallback className="text-sm text-text-secondary font-medium">{initialsOf(label)}</Avatar.Fallback>
      </Avatar.Root>
    )
    const identity = (
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium text-text-primary truncate">{label}</p>
        <p className="text-xs text-text-tertiary truncate">{account.user.email}</p>
      </div>
    )
    // Unread notifications of THAT account (its own bucket), like Google's
    // per-account badge in the chooser.
    const unread = unreadCountOf(notifByUser, account.user.id)
    const badge = unread > 0 && (
      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center shrink-0">
        {unread > 9 ? '9+' : unread}
      </span>
    )
    if (account.connected) {
      return (
        <button
          key={account.slot}
          onClick={() => doSwitch(account)}
          disabled={switching}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-1 transition-colors disabled:opacity-60"
        >
          {avatar}
          {identity}
          {badge}
        </button>
      )
    }
    return (
      <div key={account.slot} className="px-4 py-3">
        <div className="flex items-center gap-3">
          {avatar}
          {identity}
          <span className="text-[11px] text-text-secondary bg-surface-2 px-2 py-0.5 rounded-md shrink-0">
            {t('account.disconnected', { defaultValue: 'Déconnecté' })}
          </span>
        </div>
        <div className="flex gap-2 mt-2.5 pl-[52px]">
          <Button
            variant="primary" size="sm"
            onClick={() => { onClose(); onAddAccount({ email: account.user.email, slot: account.slot }) }}
          >
            {t('account.reconnect', { defaultValue: 'Connexion' })}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => removeSlot(account.slot)}>
            {t('common.delete', { defaultValue: 'Supprimer' })}
          </Button>
        </div>
      </div>
    )
  }

  // PORTAL to <body>: rendered in place, the panel lives inside the AppHeader's
  // stacking context (z-50) — the right rail (z-50, later in the DOM) painted
  // OVER it whatever z-index the panel claimed. Every other header dropdown
  // already portals (Radix); this one must too for its z-[9991] to mean
  // something at root level.
  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9990]" onClick={onClose} />

      {/* Panel — same visual language as the WaffleMenu popup: tinted #E9EEF6
          ground, 28px radius (explicit: the global radius scale flattens
          rounded-2xl to 8px), same elevation shadow, white cards floating on
          the tint. Capped height + internal scroll, Google-style. */}
      {/* top 54px = same line as the WaffleMenu popup: 36px trigger centred in
          the 64px header (bottom edge 50px) + Radix sideOffset 4. */}
      <div
        ref={panelRef}
        className="fixed right-2 top-[54px] z-[9991] w-80 rounded-[28px] overflow-hidden border border-border flex flex-col"
        style={{
          background: '#E9EEF6',
          boxShadow: '0 4px 8px 3px rgba(0,0,0,.15),0 1px 3px rgba(0,0,0,.3)',
          maxHeight: 'calc(100vh - 70px)',
        }}
      >
        {/* Sticky header: the active account's email, joined by its mini avatar
            once the hero has scrolled away (Google's compact state). */}
        <div className="relative flex items-center justify-center gap-2 px-10 pt-4 pb-2 flex-shrink-0">
          {scrolled && (
            <Avatar.Root className="w-6 h-6 rounded-full overflow-hidden bg-primary flex items-center justify-center shrink-0">
              {user.avatar_url
                ? <Avatar.Image src={user.avatar_url} alt={user.display_name ?? user.username} className="w-full h-full object-cover" />
                : null}
              <Avatar.Fallback className="text-white text-[10px] font-medium">{initials}</Avatar.Fallback>
            </Avatar.Root>
          )}
          <p className="text-sm text-text-secondary truncate">{user.email}</p>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center
                       text-text-secondary hover:bg-black/8 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div
          className="overflow-y-auto min-h-0"
          onScroll={e => setScrolled((e.target as HTMLElement).scrollTop > 48)}
        >
          {/* Hero — the active account */}
          <div className="relative px-6 pt-2 pb-4 text-center">
            <div className="relative inline-block mb-3">
              <Avatar.Root className="w-24 h-24 rounded-full overflow-hidden bg-primary flex items-center justify-center mx-auto"
                style={{ outline: '3px solid #fff', boxShadow: '0 0 0 3px #1a73e8' }}
              >
                {user.avatar_url ? (
                  <Avatar.Image
                    src={user.avatar_url}
                    alt={user.display_name ?? user.username}
                    className="w-full h-full object-cover"
                  />
                ) : null}
                <Avatar.Fallback className="text-white text-2xl font-medium">{initials}</Avatar.Fallback>
              </Avatar.Root>

              {/* Camera button — ouvre la modale de recadrage (avatar actuel ou import) */}
              <button
                onClick={() => setCropOpen(true)}
                disabled={uploading}
                className="absolute bottom-1 right-0 w-8 h-8 rounded-full bg-white shadow-md border border-border
                           flex items-center justify-center hover:bg-surface-1 transition-colors"
                title={t('shell.change_photo')}
              >
                <Camera size={15} className="text-text-secondary" />
              </button>
            </div>

            {/* Greeting */}
            <p className="text-2xl font-normal text-text-primary mb-3">
              {t('shell.greeting', { name: user.display_name?.split(' ')[0] ?? user.username })}
            </p>

            {/* Manage account */}
            <Link
              to="/settings"
              onClick={onClose}
              className="inline-block px-5 py-1.5 rounded-full text-sm text-primary
                         border border-primary/40 hover:bg-primary/5 transition-colors"
            >
              {t('shell.manage_account')}
            </Link>
          </div>

          {/* Other accounts of this browser (+ remote-instance ones) */}
          {(others.length > 0 || remoteAccounts.length > 0) && (
            <div className="mx-2 mb-2 rounded-[20px] overflow-hidden bg-white">
              {/* Toggle row */}
              <button
                onClick={() => setAccountsExpanded(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-1 transition-colors"
              >
                <span className="text-sm font-medium text-text-primary">
                  {accountsExpanded ? t('shell.hide_more_accounts') : t('shell.show_more_accounts')}
                </span>
                <div className="flex items-center gap-2">
                  {/* Mini avatars when collapsed */}
                  {!accountsExpanded && (
                    <div className="flex -space-x-1">
                      {others.slice(0, 2).map(a => {
                        const label = a.user.display_name ?? a.user.email
                        return (
                          <Avatar.Root key={a.slot} className="w-6 h-6 rounded-full overflow-hidden bg-surface-3 border-2 border-white flex items-center justify-center">
                            {a.user.avatar_url
                              ? <Avatar.Image src={a.user.avatar_url} alt={label} className="w-full h-full object-cover" />
                              : null}
                            <Avatar.Fallback className="text-[10px] text-text-secondary">{label.slice(0, 1).toUpperCase()}</Avatar.Fallback>
                          </Avatar.Root>
                        )
                      })}
                      {others.length > 2 && (
                        <span className="w-6 h-6 rounded-full bg-surface-3 border-2 border-white flex items-center justify-center text-[10px] text-text-secondary font-medium">
                          +{others.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  {accountsExpanded ? <ChevronUp size={16} className="text-text-tertiary" /> : <ChevronDown size={16} className="text-text-tertiary" />}
                </div>
              </button>

              {accountsExpanded && (
                <div className="divide-y divide-border/50">
                  {others.map(accountRow)}

                  {/* Accounts living on ANOTHER Kubuno instance: opened in a new
                      tab — a different server cannot share this one's session. */}
                  {remoteAccounts.map(account => {
                    const label = account.display_name ?? account.email
                    let hostname = account.instance_url
                    try { hostname = new URL(account.instance_url).hostname } catch { /* noop */ }
                    return (
                      <div key={account.id} className="px-4 py-3">
                        <div className="flex items-center gap-3 mb-2.5">
                          <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden bg-surface-3 flex items-center justify-center shrink-0">
                            {account.avatar_url
                              ? <Avatar.Image src={account.avatar_url} alt={label} className="w-full h-full object-cover" />
                              : null}
                            <Avatar.Fallback className="text-sm text-text-secondary font-medium">{initialsOf(label)}</Avatar.Fallback>
                          </Avatar.Root>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{label}</p>
                            <p className="text-xs text-text-tertiary truncate">{account.email}</p>
                          </div>
                          <span className="text-[11px] text-text-tertiary bg-surface-2 px-2 py-0.5 rounded-full border border-border/60 shrink-0">
                            {hostname}
                          </span>
                        </div>
                        <div className="flex gap-2 pl-[52px]">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<ExternalLink size={13} />}
                            onClick={() => window.open(account.instance_url, '_blank', 'noopener,noreferrer')}
                          >
                            {t('account.open', { defaultValue: 'Ouvrir' })}
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => removeRemote(account.id)}>
                            {t('common.delete', { defaultValue: 'Supprimer' })}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Actions list */}
          <div className="mx-2 mb-2 rounded-[20px] overflow-hidden bg-white divide-y divide-border/50">
            {/* Ajouter un compte */}
            <button
              onClick={() => { onClose(); onAddAccount() }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-primary
                         hover:bg-surface-1 transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                <UserPlus size={16} className="text-text-secondary" />
              </span>
              {t('shell.add_account')}
            </button>

            {/* Cross-module labels: manage and browse everything the user tagged. */}
            <Link
              to="/labels"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-sm text-text-primary
                         hover:bg-surface-1 transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                <Tag size={16} className="text-text-secondary" />
              </span>
              {t('user.labels', { defaultValue: 'Étiquettes' })}
            </Link>

            {/* Administration — visible to anyone who may enter the console, which
                includes a delegated administrator (still `role = 'user'`). */}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-sm text-text-primary
                           hover:bg-surface-1 transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                  <Shield size={16} className="text-text-secondary" />
                </span>
                {t('user.admin')}
              </Link>
            )}

            {/* Déconnexion : du compte actif seul, ou de TOUS les comptes du
                navigateur quand il y en a plusieurs (comme Google). */}
            <button
              onClick={others.length > 0 ? handleLogoutAll : handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-primary
                         hover:bg-surface-1 transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                <LogOut size={16} className="text-text-secondary" />
              </span>
              {others.length > 0
                ? t('shell.logout_all', { defaultValue: 'Se déconnecter de tous les comptes' })
                : t('user.logout')}
            </button>
          </div>
        </div>
      </div>

      {cropOpen && (
        <AvatarCropModal
          initialSrc={user.avatar_url ? `/api/v1/users/${user.id}/avatar/original?v=${Date.now()}` : null}
          initialCrop={(user.preferences?.avatar_crop as AvatarCrop) ?? null}
          saving={uploading}
          onCancel={() => setCropOpen(false)}
          onSave={handleCropSave}
        />
      )}
    </>,
    document.body,
  )
}
