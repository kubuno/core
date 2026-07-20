/**
 * Share dialog of a cross-module label: pick the users and/or groups that may
 * use it, and grant each of them plain access or full co-ownership.
 *
 * Plain access = a shared vocabulary: the recipient sees the label in the picker
 * and may attach it to THEIR OWN elements, but never sees the others' elements.
 * "Peut gérer" = co-ownership: rename, recolor, re-share, delete for everyone,
 * and see every element carrying the label.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Search, User, Users, Trash2 } from 'lucide-react'
import { Button, Input, Checkbox, Spinner, LabelIcon } from '@ui'
import { labelsApi, type CoreLabel, type LabelShare } from '../api/labels'

/** One audience entry being edited (a saved share or a freshly picked target). */
interface Draft {
  kind:       'user' | 'group'
  subjectId:  string
  name:       string
  can_manage: boolean
}

interface Props {
  label:   CoreLabel
  onClose: () => void
  onSaved: () => void
}

export default function LabelShareDialog({ label, onClose, onSaved }: Props) {
  const [drafts, setDrafts]   = useState<Draft[] | null>(null)
  const [query, setQuery]     = useState('')
  const [targets, setTargets] = useState<{ kind: 'user' | 'group'; id: string; name: string; hint?: string }[]>([])
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const toDraft = (s: LabelShare): Draft => ({
    kind:       s.kind,
    subjectId:  (s.kind === 'group' ? s.group_id : s.user_id) ?? '',
    name:       s.name,
    can_manage: s.can_manage,
  })

  useEffect(() => {
    labelsApi.shares(label.id)
      .then(list => setDrafts(list.map(toDraft)))
      .catch(() => setDrafts([]))
  }, [label.id])

  // Debounced target search; already-picked subjects drop out of the results.
  const picked = useMemo(
    () => new Set((drafts ?? []).map(d => `${d.kind}:${d.subjectId}`)),
    [drafts],
  )
  useEffect(() => {
    const t = setTimeout(() => {
      labelsApi.shareTargets(query)
        .then(r => setTargets([
          ...r.groups.map(g => ({
            kind: 'group' as const, id: g.id, name: g.name,
            hint: `${g.member_count} membre${g.member_count > 1 ? 's' : ''}`,
          })),
          ...r.users.map(u => ({ kind: 'user' as const, id: u.id, name: u.name })),
        ]))
        .catch(() => setTargets([]))
    }, 200)
    return () => clearTimeout(t)
  }, [query])

  const add = useCallback((t: { kind: 'user' | 'group'; id: string; name: string }) => {
    setDrafts(prev => {
      const list = prev ?? []
      if (list.some(d => d.kind === t.kind && d.subjectId === t.id)) return list
      return [...list, { kind: t.kind, subjectId: t.id, name: t.name, can_manage: false }]
    })
    setQuery('')
  }, [])

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await labelsApi.setShares(label.id, (drafts ?? []).map(d => ({
        ...(d.kind === 'user' ? { user_id: d.subjectId } : { group_id: d.subjectId }),
        can_manage: d.can_manage,
      })))
      onSaved()
      onClose()
    } catch {
      setError('Le partage n’a pas pu être enregistré.')
      setSaving(false)
    }
  }

  const visible = targets.filter(t => !picked.has(`${t.kind}:${t.id}`))

  return (
    <Dialog.Root open onOpenChange={o => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(94vw,32rem)] max-h-[85vh] flex flex-col rounded-xl bg-surface-0 shadow-xl border border-border">
          <div className="flex items-start gap-2.5 px-5 pt-5 pb-3">
            <LabelIcon size={16} className="mt-0.5 flex-shrink-0" style={{ color: label.color }} />
            <div className="flex-1 min-w-0">
              <Dialog.Title className="text-base font-semibold text-text-primary truncate">
                Partager « {label.name} »
              </Dialog.Title>
              <Dialog.Description className="text-xs text-text-tertiary mt-0.5">
                Les destinataires pourront étiqueter leurs propres éléments. Cochez
                « Peut gérer » pour accorder la co-propriété : modification, partage,
                suppression, et accès aux éléments étiquetés par les autres.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button aria-label="Fermer" className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-2">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <div className="px-5 pb-3">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un utilisateur ou un groupe…"
              leftIcon={<Search size={14} />}
            />
            {!!visible.length && (
              <div className="mt-1.5 max-h-44 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {visible.map(t => (
                  <button
                    key={`${t.kind}:${t.id}`}
                    onClick={() => add(t)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-1"
                  >
                    {t.kind === 'group'
                      ? <Users size={14} className="text-text-tertiary flex-shrink-0" />
                      : <User  size={14} className="text-text-tertiary flex-shrink-0" />}
                    <span className="flex-1 text-sm text-text-primary truncate">{t.name}</span>
                    {t.hint && <span className="text-[11px] text-text-tertiary">{t.hint}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-2 min-h-0">
            {drafts === null ? (
              <div className="flex justify-center py-8"><Spinner size="sm" /></div>
            ) : !drafts.length ? (
              <p className="py-8 text-center text-xs text-text-tertiary">
                Cette étiquette n’est partagée avec personne. Elle n’est visible que par vous.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {drafts.map((d, i) => (
                  <li key={`${d.kind}:${d.subjectId}`} className="flex items-center gap-2.5 py-2">
                    {d.kind === 'group'
                      ? <Users size={14} className="text-text-tertiary flex-shrink-0" />
                      : <User  size={14} className="text-text-tertiary flex-shrink-0" />}
                    <span className="flex-1 text-sm text-text-primary truncate">{d.name}</span>
                    <Checkbox
                      checked={d.can_manage}
                      onChange={v => setDrafts(prev =>
                        (prev ?? []).map((x, j) => (j === i ? { ...x, can_manage: v } : x)))}
                      label="Peut gérer"
                      labelClassName="text-xs text-text-secondary"
                    />
                    <button
                      aria-label={`Retirer ${d.name}`}
                      onClick={() => setDrafts(prev => (prev ?? []).filter((_, j) => j !== i))}
                      className="p-1 rounded text-text-tertiary hover:text-danger"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="px-5 pb-1 text-xs text-danger">{error}</p>}

          <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
            <Button variant="ghost" onClick={onClose}>Annuler</Button>
            <Button variant="primary" onClick={save} loading={saving} disabled={drafts === null}>
              Enregistrer
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
