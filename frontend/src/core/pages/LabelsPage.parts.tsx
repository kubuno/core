/**
 * The parts of `LabelsPage.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { useState } from "react"
import { Pencil, Trash2, Check, Search, X, Share2, Users } from "lucide-react"
import { Input, Dropdown, LabelIcon } from "@ui"
import { useConfirm } from "../hooks/useConfirm"
import { labelsApi, type CoreLabel } from "../api/labels"
import type { LabelsPage } from './LabelsPage'
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
export { LabelRow }

export function Part1({ query, setQuery }: { query: NonNullable<LabelsPage['query']>; setQuery: NonNullable<LabelsPage['setQuery']> }) {
  return (
    <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher dans les éléments étiquetés…"
                  leftIcon={<Search size={14} />}
                />
  )
}

export function Part2({ moduleFilter, setModuleFilter, moduleOptions }: { moduleFilter: NonNullable<LabelsPage['moduleFilter']>; setModuleFilter: NonNullable<LabelsPage['setModuleFilter']>; moduleOptions: NonNullable<LabelsPage['moduleOptions']> }) {
  return (
    <Dropdown value={moduleFilter} onChange={setModuleFilter} options={moduleOptions} height={38} width={180} />
  )
}

export function Part3({ selected, byId, toggle }: { selected: NonNullable<LabelsPage['selected']>; byId: NonNullable<LabelsPage['byId']>; toggle: LabelsPage['toggle'] }) {
  return (
    <>{[...selected].map(id => {
                const l = byId.get(id)
                return l ? (
                  <span key={id} className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full text-xs text-white" style={{ backgroundColor: l.color }}>
                    <LabelIcon size={9} />{l.name}
                    <button aria-label={`Retirer le filtre ${l.name}`} onClick={() => toggle(id)} className="hover:bg-black/20 rounded-full p-0.5"><X size={11} /></button>
                  </span>
                ) : null
              })}</>
  )
}

export function Part4({ item, byId, toggle }: { item: NonNullable<LabelsPage['rows_items']>[number]['item']; byId: NonNullable<LabelsPage['byId']>; toggle: LabelsPage['toggle'] }) {
  return (
    <>{item.label_ids.map(id => {
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
                        })}</>
  )
}
