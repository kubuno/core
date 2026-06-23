import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, LogOut, UserPlus, X, ExternalLink, ChevronDown, ChevronUp, Shield } from 'lucide-react'
import * as Avatar from '@radix-ui/react-avatar'
import { useAuthStore } from '../store/authStore'
import { useLinkedAccountsStore } from '../store/linkedAccountsStore'
import { api } from '../api/client'
import AvatarCropModal, { type AvatarCrop } from '@ui/AvatarCropModal'
import { Button } from '@ui'

interface Props {
  open: boolean
  onClose: () => void
  onAddAccount: () => void
  anchorRef: React.RefObject<HTMLElement | null>
}

export default function UserPanel({ open, onClose, onAddAccount, anchorRef }: Props) {
  const { t } = useTranslation()
  const { user, logout, updateUser } = useAuthStore()
  const { accounts, remove: removeAccount } = useLinkedAccountsStore()
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)

  const [accountsExpanded, setAccountsExpanded] = useState(false)
  const [uploading, setUploading]               = useState(false)
  const [cropOpen, setCropOpen]                 = useState(false)

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

  const initials = user.display_name
    ? user.display_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user.username.slice(0, 2).toUpperCase()

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

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9990]" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-2 top-[68px] z-[9991] w-80 rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#f1f4f8', border: '1px solid #dadce0' }}
      >
        {/* Header */}
        <div className="relative px-6 pt-5 pb-4 text-center" style={{ background: '#f1f4f8' }}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center
                       text-text-secondary hover:bg-black/8 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Email */}
          <p className="text-sm text-text-secondary mb-4">{user.email}</p>

          {/* Avatar with camera overlay */}
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

        {/* Linked accounts section */}
        {accounts.length > 0 && (
          <div className="mx-3 mb-2 rounded-xl overflow-hidden bg-white border border-border/60">
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
                    {accounts.slice(0, 2).map(a => (
                      <Avatar.Root key={a.id} className="w-6 h-6 rounded-full overflow-hidden bg-surface-3 border-2 border-white flex items-center justify-center">
                        {a.avatar_url
                          ? <Avatar.Image src={a.avatar_url} alt={a.display_name ?? a.email} className="w-full h-full object-cover" />
                          : null}
                        <Avatar.Fallback className="text-[10px] text-text-secondary">{(a.display_name ?? a.email).slice(0, 1).toUpperCase()}</Avatar.Fallback>
                      </Avatar.Root>
                    ))}
                    {accounts.length > 2 && (
                      <span className="w-6 h-6 rounded-full bg-surface-3 border-2 border-white flex items-center justify-center text-[10px] text-text-secondary font-medium">
                        +{accounts.length - 2}
                      </span>
                    )}
                  </div>
                )}
                {accountsExpanded ? <ChevronUp size={16} className="text-text-tertiary" /> : <ChevronDown size={16} className="text-text-tertiary" />}
              </div>
            </button>

            {/* Expanded list */}
            {accountsExpanded && (
              <div className="divide-y divide-border/50">
                {accounts.map(account => {
                  const label    = account.display_name ?? account.email
                  const initials2 = label.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  let hostname = account.instance_url
                  try { hostname = new URL(account.instance_url).hostname } catch { /* noop */ }
                  return (
                    <div key={account.id} className="px-4 py-3">
                      <div className="flex items-center gap-3 mb-2.5">
                        <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden bg-surface-3 flex items-center justify-center shrink-0">
                          {account.avatar_url
                            ? <Avatar.Image src={account.avatar_url} alt={label} className="w-full h-full object-cover" />
                            : null}
                          <Avatar.Fallback className="text-sm text-text-secondary font-medium">{initials2}</Avatar.Fallback>
                        </Avatar.Root>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{label}</p>
                          <p className="text-xs text-text-tertiary truncate">{account.email}</p>
                        </div>
                        <span className="text-[11px] text-text-tertiary bg-surface-2 px-2 py-0.5 rounded-full border border-border/60 shrink-0">
                          {hostname}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          icon={<ExternalLink size={13} />}
                          onClick={() => window.open(account.instance_url, '_blank', 'noopener,noreferrer')}
                        >
                          Ouvrir
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => removeAccount(account.id)}
                        >
                          Supprimer
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
        <div className="mx-3 mb-3 rounded-xl overflow-hidden bg-white border border-border/60 divide-y divide-border/50">
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

          {/* Administration (admin uniquement) — déplacé depuis la barre latérale */}
          {user.role === 'admin' && (
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

          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-primary
                       hover:bg-surface-1 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
              <LogOut size={16} className="text-text-secondary" />
            </span>
            {t('user.logout')}
          </button>
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
    </>
  )
}
