/**
 * Cross-module labels page (/labels): manage the user's labels (create,
 * rename, recolor, share, delete) and browse EVERYTHING they are attached to,
 * across all modules — AND-combined label filters, free-text search, module
 * filter. Items carrying an envelope render through the same `core.data-card`
 * renderers as clipboard paste, so a labeled task, file, place or formula
 * shows its native rich card and navigates to its module on click.
 *
 * A label can be shared with users and groups. A plain recipient gets a shared
 * vocabulary (they label their own elements, and see only those); a recipient
 * with `can_manage` is a full co-owner and also sees everyone's elements.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Check, Search, X, Package, Share2, Users } from 'lucide-react'
import { Button, Input, Dropdown, Spinner, LabelIcon } from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { useConfirm } from '../hooks/useConfirm'
import { labelsApi, type CoreLabel, type LabelBrowseItem } from '../api/labels'
import { DataCardView } from '../registry/DataCardView'
import LabelShareDialog from '../components/LabelShareDialog'

const PALETTE = ['#1a73e8', '#1e8e3e', '#d93025', '#f9ab00', '#9334e6', '#e8710a', '#12805c', '#5f6368']

function LabelRow({ label, active, onToggle, onChanged, onShare, confirm }: {
  label: CoreLabel
  active: boolean
  onToggle: () => void
  onChanged: () => void
  onShare: () => void
  confirm: ReturnType<typeof useConfirm>['confirm']
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(label.name)

  const rename = async () => {
    const n = name.trim()
    setEditing(false)
    if (!n || n === label.name) { setName(label.name); return }
    try { await labelsApi.update(label.id, { name: n }); onChanged() } catch { setName(label.name) }
  }
  const setColor = async (color: string) => {
    try { await labelsApi.update(label.id, { color }); onChanged() } catch { /* keep */ }
  }
  // Deleting is co-ownership-wide: it wipes the label AND everyone's links.
  const remove = async () => {
    const shared = label.share_count > 0
    const ok = await confirm({
      title:        `Supprimer « ${label.name} » ?`,
      message: shared
        ? `Cette étiquette est partagée. La supprimer la retire pour tous ses destinataires et détache les ${label.link_count} élément(s) qu'elle relie. Cette action est irréversible.`
        : `L'étiquette sera supprimée et détachée des ${label.link_count} élément(s) qu'elle relie. Les éléments eux-mêmes ne sont pas supprimés.`,
      confirmLabel: 'Supprimer',
      variant:      'danger',
    })
    if (!ok) return
    try { await labelsApi.remove(label.id); onChanged() } catch { /* keep */ }
  }

  return (
    <div className={`group rounded-lg ${active ? 'bg-primary-light' : 'hover:bg-surface-1'}`}>
      <div className="flex items-center gap-2.5 px-3 py-2 cursor-pointer" onClick={onToggle}>
        <LabelIcon size={13} className="flex-shrink-0" style={{ color: label.color }} />
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={rename}
            onKeyDown={e => { if (e.key === 'Enter') rename(); if (e.key === 'Escape') { setName(label.name); setEditing(false) } }}
            onClick={e => e.stopPropagation()}
            className="flex-1 text-sm bg-transparent border-b border-primary outline-none text-text-primary min-w-0"
          />
        ) : (
          <span className={`flex-1 text-sm truncate ${active ? 'text-primary font-medium' : 'text-text-primary'}`}>{label.name}</span>
        )}
        {label.share_count > 0 && label.is_owner && (
          <span title={`Partagée avec ${label.share_count} destinataire(s)`}><Users size={12} className="text-text-tertiary flex-shrink-0" /></span>
        )}
        <span className="text-[11px] text-text-tertiary">{label.link_count}</span>
        <span className="hidden group-hover:flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
          {label.can_manage && <>
            <button title="Partager" onClick={onShare} className="p-1 rounded text-text-tertiary hover:text-text-primary"><Share2 size={13} /></button>
            <button title="Renommer" onClick={() => setEditing(true)} className="p-1 rounded text-text-tertiary hover:text-text-primary"><Pencil size={13} /></button>
            <button title="Supprimer" onClick={remove} className="p-1 rounded text-text-tertiary hover:text-danger"><Trash2 size={13} /></button>
          </>}
        </span>
        {active && <Check size={14} className="text-primary flex-shrink-0" />}
      </div>
      {/* Shared with the caller: name the owner, so a homonym of their own label stays legible. */}
      {!label.is_owner && (
        <p className="px-3 pb-1.5 pl-9 text-[11px] text-text-tertiary truncate">
          Partagée par {label.owner_name}{label.can_manage ? ' · vous pouvez la gérer' : ''}
        </p>
      )}
      {/* Palette, shown on hover: recolor in one click. */}
      {label.can_manage && (
        <div className="hidden group-hover:flex items-center gap-1.5 px-3 pb-2 pl-9" onClick={e => e.stopPropagation()}>
          {PALETTE.map(c => (
            <button
              key={c}
              aria-label={`Colorer en ${c}`}
              onClick={() => setColor(c)}
              className={`w-3.5 h-3.5 rounded-full hover:scale-125 transition-transform ${label.color === c ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function LabelsPage() {
  const navigate = useNavigate()
  const [labels, setLabels] = useState<CoreLabel[]>([])
  const [items, setItems] = useState<LabelBrowseItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState<CoreLabel | null>(null)
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const refreshLabels = useCallback(() => { labelsApi.list().then(setLabels).catch(() => {}) }, [])
  useEffect(() => { refreshLabels() }, [refreshLabels])

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      labelsApi.browse({ labels: [...selected], q: query, module: moduleFilter })
        .then(setItems)
        .catch(() => setItems([]))
        .finally(() => setLoading(false))
    }, 200)
    return () => clearTimeout(t)
  }, [selected, query, moduleFilter])

  const modules = useMemo(() => [...new Set(items.map(i => i.module))].sort(), [items])
  const byId = useMemo(() => new Map(labels.map(l => [l.id, l])), [labels])
  const moduleOptions = useMemo(
    () => [{ value: '', label: 'Tous les modules' }, ...modules.map(m => ({ value: m, label: m }))],
    [modules],
  )

  const toggle = (id: string) => setSelected(prev => {
    const n = new Set(prev)
    if (n.has(id)) n.delete(id); else n.add(id)
    return n
  })

  const createLabel = async () => {
    const name = newName.trim()
    if (!name) return
    try {
      await labelsApi.create(name, PALETTE[labels.length % PALETTE.length])
      setNewName('')
      refreshLabels()
    } catch { /* conflict: keep input */ }
  }

  return (
    <div className="h-full flex overflow-hidden bg-surface-0">
      {/* ── Left: label management + filter toggles ── */}
      <aside className="w-72 flex-shrink-0 border-r border-border flex flex-col">
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <LabelIcon size={15} className="text-primary" /> Étiquettes
          </h1>
          <p className="text-xs text-text-tertiary mt-1">Reliez des éléments de tous les modules, puis filtrez et retrouvez-les ici.</p>
        </div>
        <div className="px-3 pb-2">
          <div className="flex items-center gap-1.5">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createLabel() }}
              placeholder="Nouvelle étiquette…"
              className="flex-1 min-w-0"
            />
            <Button variant="primary" onClick={createLabel} disabled={!newName.trim()} aria-label="Créer l'étiquette" icon={<Plus size={15} />} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {labels.map(l => (
            <LabelRow
              key={l.id}
              label={l}
              active={selected.has(l.id)}
              onToggle={() => toggle(l.id)}
              onChanged={refreshLabels}
              onShare={() => setSharing(l)}
              confirm={confirm}
            />
          ))}
          {!labels.length && (
            <p className="px-3 py-8 text-center text-xs text-text-tertiary">Créez votre première étiquette ci-dessus, puis attachez-la depuis n'importe quel module (menu « Étiquettes… »).</p>
          )}
        </div>
      </aside>

      {/* ── Main: cross-module browse ── */}
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <div className="flex-1 max-w-md">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher dans les éléments étiquetés…"
              leftIcon={<Search size={14} />}
            />
          </div>
          <Dropdown value={moduleFilter} onChange={setModuleFilter} options={moduleOptions} height={38} width={180} />
          {[...selected].map(id => {
            const l = byId.get(id)
            return l ? (
              <span key={id} className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full text-xs text-white" style={{ backgroundColor: l.color }}>
                <LabelIcon size={9} />{l.name}
                <button aria-label={`Retirer le filtre ${l.name}`} onClick={() => toggle(id)} className="hover:bg-black/20 rounded-full p-0.5"><X size={11} /></button>
              </span>
            ) : null
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Spinner /></div>
          ) : !items.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package size={32} className="text-text-tertiary mb-3" />
              <p className="text-sm text-text-secondary">Aucun élément étiqueté ne correspond.</p>
              <p className="text-xs text-text-tertiary mt-1">Ouvrez un fichier, une tâche, un contact… et choisissez « Étiquettes… » dans son menu.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 items-start">
              {items.map(item => (
                <div key={`${item.resource_type}:${item.resource_id}`} className="flex flex-col gap-1.5">
                  {item.envelope ? (
                    <DataCardView envelope={item.envelope} />
                  ) : (
                    <button
                      onClick={() => { if (item.href) navigate(item.href) }}
                      className="w-72 rounded-xl border border-border bg-surface-0 px-3 py-2.5 text-left hover:border-strong"
                    >
                      <p className="text-xs font-semibold text-text-primary truncate">{item.title ?? item.resource_id}</p>
                      <p className="text-[11px] text-text-tertiary">{item.module} · {item.resource_type}</p>
                    </button>
                  )}
                  <div className="flex flex-wrap gap-1 px-1">
                    {item.label_ids.map(id => {
                      const l = byId.get(id)
                      return l ? (
                        <button
                          key={id}
                          onClick={() => toggle(id)}
                          title={`Filtrer sur « ${l.name} »`}
                          className="flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full text-[10px] text-white hover:opacity-80"
                          style={{ backgroundColor: l.color }}
                        ><LabelIcon size={7} />{l.name}</button>
                      ) : null
                    })}
                  </div>
                  {/* Surfaced only on labels the caller co-manages: whose element this is. */}
                  {!!item.other_owners.length && (
                    <p className="px-1 text-[10px] text-text-tertiary truncate">
                      Étiqueté par {item.other_owners.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {sharing && (
        <LabelShareDialog label={sharing} onClose={() => setSharing(null)} onSaved={refreshLabels} />
      )}
      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
