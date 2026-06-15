import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Share2, Copy, Check, Trash2, Loader2, Search, Users, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { filesApi, type FileItem, type Folder, type Recipient, type AccessEntry } from './api'
import { FloatingWindow } from '@ui'
import { Dropdown, Button } from '@ui'

export type ShareTarget =
  | { type: 'file';   item: FileItem }
  | { type: 'folder'; item: Folder }

interface Props {
  target:  ShareTarget | null
  onClose: () => void
}

function initials(r: Pick<Recipient, 'display_name' | 'email'>): string {
  const base = r.display_name ?? r.email
  return base.split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase()
}

export default function ShareModal({ target, onClose }: Props) {
  const { t, i18n } = useTranslation('drive')
  const [copied,    setCopied]    = useState(false)
  const [expiresIn, setExpiresIn] = useState<'' | '1' | '7' | '30'>('')
  const [maxDl,     setMaxDl]     = useState('')

  // Recherche de personnes
  const [search,     setSearch]     = useState('')
  const [debounced,  setDebounced]  = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const qc = useQueryClient()
  const itemId = target?.item.id

  // Debounce de la requête de recherche
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250)
    return () => clearTimeout(t)
  }, [search])

  // Fermeture du menu de résultats au click en dehors
  useEffect(() => {
    if (!searchOpen) return
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [searchOpen])

  // Liens publics existants
  const { data: sharesData, isLoading } = useQuery({
    queryKey: ['shares', itemId],
    queryFn: () => filesApi.listShares(),
    enabled: !!target,
    select: d => d.shares.filter(s =>
      target?.type === 'file'
        ? s.file_id   === itemId
        : s.folder_id === itemId,
    ).filter(s => !s.revoked_at && s.token),
  })

  // Personnes ayant accès (partages internes nommés)
  const { data: access = [], isLoading: accessLoading } = useQuery({
    queryKey: ['file-access', target?.type, itemId],
    queryFn: () =>
      (target?.type === 'file'
        ? filesApi.getFileInfoExtra(itemId!)
        : filesApi.getFolderInfoExtra(itemId!)
      ).then(r => r.access),
    enabled: !!target,
  })

  const accessIds = new Set(access.map((a: AccessEntry) => a.recipient_id))

  // Résultats de recherche
  const { data: results = [], isFetching: searching } = useQuery({
    queryKey: ['recipients', debounced],
    queryFn: () => filesApi.searchRecipients(debounced),
    enabled: debounced.length >= 1,
  })
  const filteredResults = results.filter(r => !accessIds.has(r.id))

  const createMut = useMutation({
    mutationFn: () => {
      const expires_at = expiresIn
        ? new Date(Date.now() + parseInt(expiresIn) * 86400_000).toISOString()
        : null
      return filesApi.createShare(
        target?.type === 'file'
          ? { file_id: itemId!, can_download: true, expires_at, max_downloads: maxDl ? parseInt(maxDl) : null }
          : { folder_id: itemId!, can_download: true, expires_at, max_downloads: maxDl ? parseInt(maxDl) : null },
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shares', itemId] }),
  })

  const addRecipientMut = useMutation({
    mutationFn: (recipientId: string) =>
      filesApi.createShare(
        target?.type === 'file'
          ? { file_id: itemId!, recipient_id: recipientId, can_download: true }
          : { folder_id: itemId!, recipient_id: recipientId, can_download: true },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['file-access', target?.type, itemId] })
      setSearch('')
      setDebounced('')
      setSearchOpen(false)
    },
  })

  const revokeMut = useMutation({
    mutationFn: (id: string) => filesApi.revokeShare(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shares', itemId] }),
  })

  const revokeAccessMut = useMutation({
    mutationFn: (shareId: string) => filesApi.revokeShare(shareId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['file-access', target?.type, itemId] }),
  })

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/api/v1/drive/share/${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!target) return null

  const shares = sharesData ?? []
  const label  = target.type === 'file'
    ? (target.item as FileItem).name
    : (target.item as Folder).name

  return (
    <FloatingWindow
      title={
        <span className="flex items-center gap-1.5">
          <Share2 size={14} className="text-primary" />
          {t('share.title')}
          <span className="font-normal text-text-secondary truncate max-w-[180px]">· {label}</span>
        </span>
      }
      onClose={onClose}
      defaultWidth={440}
      backdrop
    >
      <div className="p-5 space-y-5 overflow-y-auto">
        {/* Partager avec des personnes */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">
            {t('share.add_people')}
          </h3>
          <div className="relative" ref={searchRef}>
            <div className="flex items-center gap-2 border border-border rounded-xl px-2.5 py-1.5
                            focus-within:ring-2 focus-within:ring-primary">
              <Search size={14} className="text-text-tertiary flex-shrink-0" />
              <input
                type="text"
                placeholder={t('share.search_ph')}
                value={search}
                onChange={e => { setSearch(e.target.value); setSearchOpen(true) }}
                onFocus={() => setSearchOpen(true)}
                className="flex-1 text-sm bg-transparent outline-none text-text-primary"
              />
              {searching && <Loader2 size={14} className="animate-spin text-text-tertiary" />}
            </div>

            {searchOpen && debounced.length >= 1 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl border border-border
                              shadow-lg max-h-60 overflow-y-auto">
                {filteredResults.length === 0 ? (
                  <p className="text-xs text-text-tertiary px-3 py-3 text-center">
                    {searching ? t('share.searching') : t('share.no_user')}
                  </p>
                ) : (
                  filteredResults.map(r => (
                    <button
                      key={r.id}
                      onClick={() => addRecipientMut.mutate(r.id)}
                      disabled={addRecipientMut.isPending}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-1 text-left
                                 disabled:opacity-50"
                    >
                      <Avatar recipient={r} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{r.display_name ?? r.email}</p>
                        {r.display_name && <p className="text-xs text-text-tertiary truncate">{r.email}</p>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Personnes ayant accès */}
          <div className="mt-3">
            {accessLoading ? (
              <div className="flex justify-center py-2">
                <Loader2 size={14} className="animate-spin text-text-tertiary" />
              </div>
            ) : access.length === 0 ? (
              <p className="text-xs text-text-tertiary flex items-center gap-1.5 py-1">
                <Users size={13} /> {t('share.no_access')}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {access.map((a: AccessEntry) => (
                  <li key={a.share_id} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-surface-1">
                    <Avatar recipient={{ display_name: a.display_name, email: a.email, avatar_url: a.avatar_url }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{a.display_name ?? a.email}</p>
                      {a.display_name && <p className="text-xs text-text-tertiary truncate">{a.email}</p>}
                    </div>
                    <button
                      onClick={() => revokeAccessMut.mutate(a.share_id)}
                      disabled={revokeAccessMut.isPending}
                      className="p-1.5 text-text-secondary hover:text-danger rounded"
                      title={t('share.remove_access')}
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* Nouveau lien */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">
            {t('share.new_link')}
          </h3>
          <div className="flex gap-2">
            <Dropdown
              className="flex-1"
              value={expiresIn}
              onChange={v => setExpiresIn(v as '' | '1' | '7' | '30')}
              options={[
                { value: '',   label: t('share.exp_none') },
                { value: '1',  label: t('share.exp_1') },
                { value: '7',  label: t('share.exp_7') },
                { value: '30', label: t('share.exp_30') },
              ]}
            />
            <input
              type="number"
              min="1"
              placeholder={t('share.max_dl')}
              value={maxDl}
              onChange={e => setMaxDl(e.target.value)}
              className="w-32 text-xs border border-border rounded-xl px-2 py-1.5
                         focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button size="sm" onClick={() => createMut.mutate()} loading={createMut.isPending} className="whitespace-nowrap">
              {t('common.create')}
            </Button>
          </div>
        </section>

        {/* Liens existants */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">
            {t('share.active_links')}
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={16} className="animate-spin text-text-tertiary" />
            </div>
          ) : shares.length === 0 ? (
            <p className="text-xs text-text-tertiary py-3 text-center">{t('share.no_active_link')}</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {shares.map(s => (
                <li key={s.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-1 border border-[#e8eaed]">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-text-secondary truncate">{s.token?.slice(0, 24)}…</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {t('share.dl_count', { count: s.download_count })}
                      {s.max_downloads ? ` / ${s.max_downloads}` : ''}
                      {s.expires_at ? ` · ${t('share.expires_on', { date: new Date(s.expires_at).toLocaleDateString(i18n.language) })}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => copyLink(s.token!)}
                    className="p-1.5 text-text-secondary hover:text-primary rounded"
                    title={t('share.copy_link')}
                  >
                    {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={() => revokeMut.mutate(s.id)}
                    disabled={revokeMut.isPending}
                    className="p-1.5 text-text-secondary hover:text-danger rounded"
                    title={t('share.revoke')}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </FloatingWindow>
  )
}

function Avatar({ recipient }: { recipient: Pick<Recipient, 'display_name' | 'email' | 'avatar_url'> }) {
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
      {recipient.avatar_url ? (
        <img src={recipient.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-semibold text-primary">{initials(recipient)}</span>
      )}
    </div>
  )
}
